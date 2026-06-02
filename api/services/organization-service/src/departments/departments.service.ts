import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: { members: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, organizationId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreateDepartmentDto,
  ) {
    await this.assertAdmin(organizationId, userId);

    return this.prisma.department.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateDepartmentDto,
  ) {
    await this.assertAdmin(organizationId, userId);
    await this.findOne(organizationId, id);

    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, userId: string, id: string) {
    await this.assertAdmin(organizationId, userId);
    await this.findOne(organizationId, id);

    await this.prisma.department.delete({ where: { id } });

    return { message: 'Department deleted successfully' };
  }

  async findDepartmentsByUser(organizationId: string, userId: string) {
    return this.prisma.department.findMany({
      where: {
        organizationId,
        members: { some: { userId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMembersByDepartment(
    organizationId: string,
    departmentId: string,
  ) {
    await this.findOne(organizationId, departmentId);
    return this.prisma.departmentMembership.findMany({
      where: { departmentId },
    });
  }

  async addMember(
    organizationId: string,
    requestingUserId: string,
    departmentId: string,
    userId: string,
  ) {
    await this.assertAdmin(organizationId, requestingUserId);
    await this.findOne(organizationId, departmentId);

    const orgMembership = await this.prisma.membership.findFirst({
      where: { organizationId, userId },
    });
    if (!orgMembership) {
      throw new NotFoundException(
        'User is not a member of this organization',
      );
    }

    try {
      return await this.prisma.departmentMembership.create({
        data: { departmentId, userId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'User is already a member of this department',
        );
      }
      throw error;
    }
  }

  async removeMember(
    organizationId: string,
    requestingUserId: string,
    departmentId: string,
    userId: string,
  ) {
    await this.assertAdmin(organizationId, requestingUserId);
    await this.findOne(organizationId, departmentId);

    const membership = await this.prisma.departmentMembership.findUnique({
      where: {
        departmentId_userId: { departmentId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'User is not a member of this department',
      );
    }

    await this.prisma.departmentMembership.delete({
      where: { id: membership.id },
    });

    return { message: 'Member removed from department successfully' };
  }

  private async assertAdmin(organizationId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can manage departments');
    }
  }
}
