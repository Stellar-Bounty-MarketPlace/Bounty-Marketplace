import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBountyDto {
  @ApiProperty() @IsString() @IsNotEmpty() contributorId!: string;
}
