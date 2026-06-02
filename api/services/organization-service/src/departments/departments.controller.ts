import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AddDepartmentMemberDto } from './dto/add-department-member.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('organizations/:organizationId/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all departments of an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Returns all departments' })
  findAll(@Param('organizationId') organizationId: string) {
    return this.departmentsService.findAll(organizationId);
  }

  @Public()
  @Get('by-user/:userId')
  @ApiOperation({ summary: 'List departments a user belongs to (internal)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Returns departments for user' })
  findByUser(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.departmentsService.findDepartmentsByUser(
      organizationId,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Returns the department' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a department (Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  create(
    @Param('organizationId') organizationId: string,
    @Request() req: any,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(organizationId, req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department (Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(
      organizationId,
      req.user.userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department (Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 204, description: 'Department deleted successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  remove(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.departmentsService.remove(organizationId, req.user.userId, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of a department' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Returns department members' })
  findMembers(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.findMembersByDepartment(organizationId, id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a department (Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 409, description: 'User already in department' })
  addMember(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: AddDepartmentMemberDto,
  ) {
    return this.departmentsService.addMember(
      organizationId,
      req.user.userId,
      id,
      dto.userId,
    );
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a department (Admin only)' })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.departmentsService.removeMember(
      organizationId,
      req.user.userId,
      id,
      userId,
    );
  }
}
