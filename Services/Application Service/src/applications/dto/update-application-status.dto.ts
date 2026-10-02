import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsString()
  @IsNotEmpty()
  status!:
    'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
}
