import { IsEmail, IsString } from 'class-validator';
import type { LoginDto as ILoginDto } from '@pagedocs/shared-types';

export class LoginDto implements ILoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
