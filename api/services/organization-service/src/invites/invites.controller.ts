import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/update-invite.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('invites')
@ApiBearerAuth()
@Controller('invites')
@UseGuards(RolesGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({
    status: 409,
    description: 'Active invite already exists for this email',
  })
  create(@Body() createInviteDto: CreateInviteDto) {
    return this.invitesService.create(createInviteDto);
  }

  @Get()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get all invitations' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization UUID',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email' })
  @ApiResponse({ status: 200, description: 'Returns paginated invitations' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.invitesService.findAll(organizationId, {
      page: pageNum,
      limit: limitNum,
      search,
    });
  }

  @Public()
  @Get('by-token/:token')
  @ApiOperation({ summary: 'Get invite info by token (public)' })
  @ApiParam({ name: 'token', description: 'Invite token', type: String })
  @ApiResponse({ status: 200, description: 'Returns invite info' })
  @ApiResponse({ status: 400, description: 'Invite expired' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  findByToken(@Param('token') token: string) {
    return this.invitesService.findByToken(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invitation by ID' })
  @ApiParam({ name: 'id', description: 'Invitation UUID', type: String })
  @ApiResponse({ status: 200, description: 'Returns the invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  findOne(@Param('id') id: string) {
    return this.invitesService.findOne(id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiParam({ name: 'id', description: 'Invitation UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted and membership created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or expired invitation',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  acceptInvite(
    @Param('id') id: string,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    return this.invitesService.acceptInvite(id, acceptInviteDto);
  }

  @Delete(':id')
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an invitation' })
  @ApiParam({ name: 'id', description: 'Invitation UUID', type: String })
  @ApiResponse({ status: 204, description: 'Invitation deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  remove(@Param('id') id: string) {
    return this.invitesService.remove(id);
  }
}
