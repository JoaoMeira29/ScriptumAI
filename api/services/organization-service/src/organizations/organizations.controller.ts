import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateTrialOnboardingDto } from './dto/create-trial-onboarding.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new organization (Public - Bootstrap endpoint)',
    description:
      'Public endpoint to create an organization. Use this for initial setup. After that, use POST /organizations with admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 409,
    description: 'Subdomain or email already in use',
  })
  register(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Public()
  @Post('onboarding-trial')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create organization + admin membership + free trial',
    description:
      'Bootstrap endpoint used by auth-service during signup with free trial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Organization data conflict' })
  createTrialOnboarding(
    @Body() createTrialOnboardingDto: CreateTrialOnboardingDto,
  ) {
    return this.organizationsService.createTrialOnboarding(
      createTrialOnboardingDto,
    );
  }

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new organization (Admin only)',
    description:
      'Protected endpoint. Only users with admin role can create organizations.',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({
    status: 409,
    description: 'Subdomain or email already in use',
  })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Returns all organizations' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization UUID', type: String })
  @ApiResponse({ status: 200, description: 'Returns the organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id.replace(/['"]+/g, ''));
  }

  @Public()
  @Get(':id/status')
  @ApiOperation({ summary: 'Get organization status (internal use)' })
  @ApiParam({ name: 'id', description: 'Organization UUID', type: String })
  @ApiResponse({ status: 200, description: 'Returns organization status' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getStatus(@Param('id') id: string) {
    const org = await this.organizationsService.findOne(id.replace(/['"]+/g, ''));
    return { id: org.id, status: org.status };
  }

  @Public()
  @Get(':id/subscription-status')
  @ApiOperation({ summary: 'Get organization subscription status' })
  @ApiParam({ name: 'id', description: 'Organization UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns organization trial status',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization/subscription not found',
  })
  getSubscriptionStatus(@Param('id') id: string) {
    return this.organizationsService.getSubscriptionStatusByOrganizationId(
      id.replace(/['"]+/g, ''),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({
    status: 409,
    description: 'Subdomain or email already in use',
  })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      id.replace(/['"]+/g, ''),
      updateOrganizationDto,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an organization (PUT)' })
  updatePut(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      id.replace(/['"]+/g, ''),
      updateOrganizationDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id.replace(/['"]+/g, ''));
  }
}
