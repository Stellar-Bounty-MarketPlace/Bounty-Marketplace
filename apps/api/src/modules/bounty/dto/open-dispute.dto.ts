import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenDisputeDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(2000) reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) evidence?: string;
}
