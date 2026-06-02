import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Name of the department',
    example: 'Engineering',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the department',
    example: 'Responsible for software development and infrastructure',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
