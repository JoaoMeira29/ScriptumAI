import {
  Controller,
  Body,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Req,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DocumentService } from './document.service';
import {
  DocumentResponse,
  DocumentResponseDto,
} from './dto/document-response.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { type AuthenticatedUser } from 'src/common/types/request';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type FastifyRequest } from 'fastify/types/request';
import { Readable } from 'stream';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteResponseDto } from './dto/delete-response.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  /**
   * POST /documents
   */
  @Post()
  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Uploads a file to storage and saves metadata. Supports multipart/form-data (file upload) and application/json (text content).',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'File to upload or JSON content',
    schema: {
      oneOf: [
        {
          type: 'object',
          required: ['file'],
          properties: {
            file: { type: 'string', format: 'binary' },
            description: { type: 'string' },
            departmentId: { type: 'string', format: 'uuid' },
          },
        },
        {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            organizationId: { type: 'string' },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - No file uploaded or invalid content',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Storage or database failure',
  })
  async uploadDocument(
    @Req() request: FastifyRequest,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResponse> {
    this.logger.log(`Upload request from user: ${user.userId}`);

    const contentType = request.headers['content-type'];

    // Handle JSON text content
    if (contentType?.includes('application/json')) {
      const body = request.body as any;

      if (!body.content || !body.title) {
        throw new BadRequestException(
          'Title and content are required for JSON upload',
        );
      }

      const buffer = Buffer.from(body.content, 'utf-8');
      const stream = Readable.from(buffer);

      const fileObj = {
        filename: `${body.title.replace(/[^a-z0-9]/gi, '_')}.txt`,
        mimetype: 'text/plain',
        file: stream,
      };

      return this.documentService.uploadDocument(user, {
        file: fileObj,
        fileSize: buffer.length,
        description: body.description,
        departmentId: body.departmentId,
      });
    }

    // Handle Multipart File Upload
    const data = await request.file();

    if (!data) {
      throw new BadRequestException('No file uploaded.');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    const stream = Readable.from(buffer);

    const fileObj = {
      filename: data.filename,
      mimetype: data.mimetype,
      file: stream,
    };

    return this.documentService.uploadDocument(user, {
      file: fileObj,
      fileSize: buffer.length,
      description: (data.fields.description as any)?.value,
      departmentId: (data.fields.departmentId as any)?.value,
      name: (data.fields.name as any)?.value,
    });
  }

  /**
   * GET /documents
   * List all documents for the current user's organization
   */
  @Get()
  @ApiOperation({
    summary: 'List all documents',
    description:
      "Returns documents for the current user's organization with pagination and search.",
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by document name' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of documents',
  })
  async listDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.documentService.listDocuments(user, { page: pageNum, limit: limitNum, search });
  }

  /**
   * POST /documents/chat/global
   * Global chat across all accessible documents
   */
  @Post('chat/global')
  @ApiOperation({
    summary: 'Global chat across documents',
    description:
      'Ask a question across all documents the user has access to. Uses RAG to search multiple vector stores.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Global chat response' })
  @ApiResponse({ status: 403, description: 'Quota reached' })
  async globalChat(
    @Body('message') message: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.globalChat(user, message);
  }

  /**
   * GET /documents/chat/global/history
   * Returns global chat history for the current user
   */
  @Get('chat/global/history')
  @ApiOperation({
    summary: 'Get global chat history',
    description: 'Returns the full global chat history for the current user.',
  })
  @ApiResponse({ status: 200, description: 'Chat history' })
  async getGlobalChatHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.documentService.getGlobalChatHistory(user);
  }

  /**
   * GET /documents/chat/global/usage
   * Returns global chat usage for the current user
   */
  @Get('chat/global/usage')
  @ApiOperation({
    summary: 'Get global chat usage',
    description:
      'Returns the current user global chat usage and quota information.',
  })
  @ApiResponse({ status: 200, description: 'Global chat usage' })
  async getGlobalChatUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.documentService.getGlobalChatUsage(user);
  }

  /**
   * GET /documents/chat/usage
   * Returns chat usage for the current user
   */
  @Get('chat/usage')
  @ApiOperation({
    summary: 'Get chat usage',
    description: 'Returns the current user chat usage and quota information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat usage retrieved successfully',
  })
  async getChatUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.documentService.getChatUsage(user);
  }

  /**
   * GET /documents/:id/chat/usage
   * Returns chat usage for a specific document
   */
  @Get(':id/chat/usage')
  @ApiOperation({
    summary: 'Get document chat usage',
    description: 'Returns the current user chat usage for a specific document.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Document ID',
  })
  @ApiResponse({ status: 200, description: 'Document chat usage' })
  async getDocumentChatUsage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.getChatUsage(user, id);
  }

  /**
   * GET /documents/:id/chat/history
   * Returns chat history for a specific document
   */
  @Get(':id/chat/history')
  @ApiOperation({
    summary: 'Get document chat history',
    description: 'Returns the full chat history for a specific document.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Document ID',
  })
  @ApiResponse({ status: 200, description: 'Chat history' })
  async getDocumentChatHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.getDocumentChatHistory(user, id);
  }

  /**
   * GET /documents/:id
   * Get a single document with download URL
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a document by ID',
    description: 'Returns details + download URL.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Document ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResponse> {
    return this.documentService.getDocument(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Updated document',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResponse> {
    return this.documentService.updateDocument(user, id, dto);
  }

  /**
   * POST /documents/:id/chat
   * Send a contextual chat message about a document
   */
  @Post(':id/chat')
  @ApiOperation({
    summary: 'Chat with a document',
    description:
      'Generates a contextual answer using the document content and enforces per-user chat quotas.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Quota reached',
  })
  async chatWithDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('message') message: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.chatWithDocument(user, id, message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deleted successfully',
    type: DeleteResponseDto,
  })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.documentService.deleteDocument(user, id);
    return { message: `Document ${id} deleted successfully` };
  }
}
