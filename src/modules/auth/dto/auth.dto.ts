import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ChangePasswordDto {
  @IsStrongPassword()
  password: string;

  @IsStrongPassword()
  newPassword: string;
}

export class ConfirmEmailDto {
  @IsString()
  code: string;
}

export class SignInDto {
  @IsEmail()
  @ApiProperty({
    example: 'ttson.1711@gmail.com',
  })
  email: string;

  @IsStrongPassword()
  @ApiProperty({
    example: '12345678',
  })
  password: string;
}

export class SignUpDto extends SignInDto {
  @IsString({
    message: 'First name must be a string',
  })
  @MinLength(2)
  @MaxLength(255)
  firstName: string;

  @IsString({
    message: 'Last name must be a string',
  })
  @MinLength(2)
  @MaxLength(255)
  lastName: string;

  @IsPhoneNumber('VN')
  phoneNumber: string;
}
