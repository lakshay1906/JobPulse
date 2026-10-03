import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateInterviewDTO {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  @IsDateString()
  scheduledAt!: string;
}
