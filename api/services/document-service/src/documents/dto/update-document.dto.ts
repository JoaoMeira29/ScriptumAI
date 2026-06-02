import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Display name of the document' })
  originalName?: string;

  @ApiPropertyOptional({ description: 'Document description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Department UUID', format: 'uuid' })
  departmentId?: string | null;
}
