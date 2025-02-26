import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { BaseResponseDto } from 'src/app/base.dto';
import { INVALID_BRANCH_SLUG } from 'src/branch/branch.validation';
import { INVALID_TABLE_NAME } from './table.validation';

export class CreateTableRequestDto {
  @AutoMap()
  @ApiProperty({ description: 'The table name', example: 'Bàn 1' })
  @IsNotEmpty({ message: INVALID_TABLE_NAME })
  name: string;

  @AutoMap()
  @ApiProperty({ description: 'The slug of branch', example: '' })
  @IsNotEmpty({ message: INVALID_BRANCH_SLUG })
  branch: string;

  @AutoMap()
  @ApiProperty({
    description: 'The location of table',
  })
  @IsOptional()
  location?: string;

  @AutoMap()
  @ApiProperty({ description: 'The status of table', example: 'available' })
  @IsNotEmpty()
  status: string;
}

export class UpdateTableRequestDto {
  @AutoMap()
  @ApiProperty({ description: 'The name of table', example: 'Bàn 1' })
  @IsNotEmpty()
  name: string;

  @AutoMap()
  @ApiProperty({
    description: 'The real location of table',
  })
  @IsOptional()
  location?: string;
}

export class UpdateTableStatusRequestDto {
  @AutoMap()
  @ApiProperty({ description: 'The status of table', example: 'active' })
  @IsNotEmpty()
  status: string;
}

export class TableResponseDto extends BaseResponseDto {
  @AutoMap()
  @ApiProperty()
  name: string;

  @AutoMap()
  @ApiProperty()
  location: string;

  @AutoMap()
  @ApiProperty()
  xPosition: number;

  @AutoMap()
  @ApiProperty()
  yPosition: number;

  @AutoMap()
  @ApiProperty()
  status: string;
}
