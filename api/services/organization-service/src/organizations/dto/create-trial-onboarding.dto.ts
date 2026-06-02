import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateTrialOnboardingDto {
  @ApiProperty({
    description: 'Organization display name',
    example: 'Empresa Trial',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'organizationName is required' })
  @IsString({ message: 'organizationName must be a string' })
  @Length(2, 100, {
    message: 'organizationName must be between 2 and 100 characters',
  })
  organizationName: string;

  @ApiProperty({
    description: 'User ID that will become organization ADMIN',
    example: '86fdd9e6-d2f1-462f-9f37-5a0f4a738614',
  })
  @IsNotEmpty({ message: 'ownerUserId is required' })
  @IsUUID('4', { message: 'ownerUserId must be a valid UUID' })
  ownerUserId: string;

  @ApiProperty({
    description: 'Owner email used as organization contact email',
    example: 'trial@scriptumai.com',
  })
  @IsNotEmpty({ message: 'ownerEmail is required' })
  @IsEmail({}, { message: 'ownerEmail must be a valid email' })
  ownerEmail: string;

  @ApiPropertyOptional({ description: 'City', example: 'Barcelos' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  city?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Campus do IPCA',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  address?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number (min 9 digits)',
    example: 912345678,
  })
  @IsOptional()
  @IsInt()
  @Min(100000000)
  contact?: number;

  @ApiPropertyOptional({
    description: 'Postal code (0000-000)',
    example: '4750-810',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{3}$/, { message: 'zipCode must be in format 0000-000' })
  zipCode?: string;
}
