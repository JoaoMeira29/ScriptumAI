import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Name of the department',
    example: 'Engineering',
    minLength: 1,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the department',
    example: 'Responsible for software development and infrastructure',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
