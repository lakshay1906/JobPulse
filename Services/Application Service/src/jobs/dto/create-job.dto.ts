import { IsEmail, IsString, IsUrl } from 'class-validator';

export class CreateJobDto {
  @IsEmail()
  @IsString()
  companyId!: string;

  @IsEmail()
  @IsString()
  title!: string;

  @IsEmail()
  @IsString()
  description!: string;

  @IsEmail()
  @IsString()
  location!: string;

  @IsEmail()
  @IsString()
  @IsUrl()
  jobUrl!: string;

  @IsEmail()
  @IsString()
  employmentType!:
    'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
}
