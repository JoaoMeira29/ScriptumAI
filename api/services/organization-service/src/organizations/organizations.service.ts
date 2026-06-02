import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { CreateTrialOnboardingDto } from './dto/create-trial-onboarding.dto';

@Injectable()
export class OrganizationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrganizationsService.name);
  private trialExpirationInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  onModuleInit() {
    // Run once at boot and then every hour.
    void this.expireTrialsAndEmitEvents();
    this.trialExpirationInterval = setInterval(
      () => {
        void this.expireTrialsAndEmitEvents();
      },
      60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.trialExpirationInterval) {
      clearInterval(this.trialExpirationInterval);
      this.trialExpirationInterval = null;
    }
  }

  async create(createOrganizationDto: CreateOrganizationDto) {
    // Check if subdomain already exists
    const existingSubdomain = await this.prisma.organization.findFirst({
      where: { subdomain: createOrganizationDto.subdomain },
    });

    if (existingSubdomain) {
      throw new ConflictException('Subdomain is already in use');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.organization.findFirst({
      where: { email: createOrganizationDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email is already in use');
    }

    // Create the organization
    const organization = await this.prisma.organization.create({
      data: createOrganizationDto,
    });

    return organization;
  }

  async createTrialOnboarding(
    createTrialOnboardingDto: CreateTrialOnboardingDto,
  ) {
    const { organizationName, ownerUserId, ownerEmail } =
      createTrialOnboardingDto;

    if (!organizationName?.trim()) {
      throw new BadRequestException('organizationName is required');
    }

    if (!ownerUserId?.trim()) {
      throw new BadRequestException('ownerUserId is required');
    }

    if (!ownerEmail?.trim()) {
      throw new BadRequestException('ownerEmail is required');
    }

    const uniqueSubdomain =
      await this.generateUniqueSubdomain(organizationName);

    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 15);

    const { organization, subscription } = await this.prisma.$transaction(
      async (tx) => {
        const createdOrganization = await tx.organization.create({
          data: {
            name: organizationName,
            email: ownerEmail,
            subdomain: uniqueSubdomain,
            city: createTrialOnboardingDto.city ?? 'N/A',
            address: createTrialOnboardingDto.address ?? 'N/A',
            contact: createTrialOnboardingDto.contact ?? 900000000,
            zipCode: createTrialOnboardingDto.zipCode ?? '0000-000',
            status: 'active',
          },
        });

        await tx.membership.create({
          data: {
            organizationId: createdOrganization.id,
            userId: ownerUserId,
            role: 'ADMIN',
          },
        });

        const createdSubscription = await tx.subscription.create({
          data: {
            organizationId: createdOrganization.id,
            plan: 'free_trial',
            status: 'trialing',
            trialStart,
            trialEnd,
          },
        });

        return {
          organization: createdOrganization,
          subscription: createdSubscription,
        };
      },
    );

    return {
      organization,
      membership: {
        userId: ownerUserId,
        role: 'ADMIN',
      },
      trial: {
        status: subscription.status,
        starts_at: subscription.trialStart,
        ends_at: subscription.trialEnd,
        days_remaining: 15,
      },
    };
  }

  async getSubscriptionStatusByOrganizationId(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, email: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for organization');
    }

    let status = subscription.status;
    const now = new Date();

    if (status === 'trialing' && now > subscription.trialEnd) {
      const updated = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      });
      status = updated.status;
    }

    const msLeft = subscription.trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(
      Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
      0,
    );

    return {
      organization,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status,
        trial_start: subscription.trialStart,
        trial_end: subscription.trialEnd,
        days_remaining: daysRemaining,
      },
    };
  }

  private async expireTrialsAndEmitEvents() {
    try {
      const now = new Date();
      const expiredTrials = await this.prisma.subscription.findMany({
        where: {
          status: 'trialing',
          trialEnd: {
            lt: now,
          },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      for (const subscription of expiredTrials) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'expired' },
        });

        await this.rabbitMQService.emit('trial.expired', {
          organization_id: subscription.organization.id,
          organization_name: subscription.organization.name,
          owner_email: subscription.organization.email,
          trial_ended_at: subscription.trialEnd.toISOString(),
        });

        this.logger.log(
          `Trial expired for organization ${subscription.organization.id}`,
        );
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process trial expiration: ${err.message}`);
    }
  }

  private async generateUniqueSubdomain(
    organizationName: string,
  ): Promise<string> {
    const baseSubdomain = this.toSubdomain(organizationName);
    let candidate = baseSubdomain;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.organization.findFirst({
        where: { subdomain: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSubdomain}-${counter}`;
      counter += 1;
    }
  }

  private toSubdomain(value: string): string {
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!normalized) {
      return `org-${Date.now()}`;
    }

    return normalized.slice(0, 50);
  }

  async findAll() {
    return await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: true,
        invites: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // Check if organization exists
    await this.findOne(id);

    // If updating subdomain, check if it already exists
    if (updateOrganizationDto.subdomain) {
      const existingSubdomain = await this.prisma.organization.findFirst({
        where: {
          subdomain: updateOrganizationDto.subdomain,
          NOT: { id },
        },
      });

      if (existingSubdomain) {
        throw new ConflictException('Subdomain is already in use');
      }
    }

    // If updating email, check if it already exists
    if (updateOrganizationDto.email) {
      const existingEmail = await this.prisma.organization.findFirst({
        where: {
          email: updateOrganizationDto.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        throw new ConflictException('Email is already in use');
      }
    }

    const previous = await this.prisma.organization.findUnique({ where: { id } });

    const updated = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });

    if (
      updateOrganizationDto.status === 'suspended' &&
      previous?.status !== 'suspended'
    ) {
      await this.rabbitMQService.emit('org.suspended', {
        organizationId: updated.id,
        organizationName: updated.name,
        adminEmail: updated.email,
      });
    }

    return updated;
  }

  async remove(id: string) {
    // Check if organization exists
    await this.findOne(id);

    await this.prisma.organization.delete({
      where: { id },
    });

    return { message: 'Organization deleted successfully' };
  }
}
