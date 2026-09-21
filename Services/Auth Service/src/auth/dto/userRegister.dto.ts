import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class userRegisterDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message:
      'Your password is too weak. Enter a password of more than 8 characters',
  })
  @MaxLength(20, {
    message: `Password can't exceed more than 20 characters`,
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;
}
