import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDTO {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
