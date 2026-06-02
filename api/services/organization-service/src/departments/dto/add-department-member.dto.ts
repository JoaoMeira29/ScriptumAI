import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddDepartmentMemberDto {
  @ApiProperty({
    description: 'UUID of the user to add to the department',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;
}
