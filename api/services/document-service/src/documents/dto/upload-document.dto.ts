import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const uploadDocumentSchema = z.object({
  description: z.string().max(500).optional(),
  departmentId: z.uuid().optional(),
});

export class UploadDocumentDto extends createZodDto(uploadDocumentSchema) {}
