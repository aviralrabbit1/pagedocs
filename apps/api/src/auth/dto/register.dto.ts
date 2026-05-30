import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import type { RegisterDto as IRegisterDto } from '@pagedocs/shared-types';

export class RegisterDto implements IRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
