import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the first user',
  })
  @IsInt()
  @Min(1)
  userAId: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the second user',
  })
  @IsInt()
  @Min(1)
  userBId: number;
}