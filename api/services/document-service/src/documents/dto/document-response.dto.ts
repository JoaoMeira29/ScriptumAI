import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const documentResponseSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  uploadedBy: z.uuid(),
  uploadedByName: z.string(),
  departmentId: z.uuid().nullable(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  aiStatus: z.string().nullable().optional(),
  aiProcessedAt: z.iso.datetime().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  aiEntities: z.unknown().nullable().optional(),
  aiKeywords: z.unknown().nullable().optional(),
  aiConfidence: z.number().nullable().optional(),
  aiError: z.string().nullable().optional(),
  downloadUrl: z.url().optional(),
});

export class DocumentResponseDto extends createZodDto(documentResponseSchema) {}

export type DocumentResponse = z.infer<typeof documentResponseSchema>;
