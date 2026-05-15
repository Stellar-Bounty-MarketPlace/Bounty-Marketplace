import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsUrl,
  IsInt,
  Min,
  MaxLength,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BountyDifficulty, BountyCategory } from '@bounty/shared';

class MilestoneDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsNumber() @Min(0) amount!: number;
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}

export class CreateBountyDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty() @IsString() @MaxLength(10000) description!: string;
  @ApiProperty({ enum: BountyDifficulty }) @IsEnum(BountyDifficulty) difficulty!: BountyDifficulty;
  @ApiProperty({ enum: BountyCategory }) @IsEnum(BountyCategory) category!: BountyCategory;
  @ApiProperty() @IsNumber() @Min(1) amount!: number;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty() @IsString() repositoryId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) issueNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() issueUrl?: string;
  @ApiPropertyOptional({ type: [MilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
