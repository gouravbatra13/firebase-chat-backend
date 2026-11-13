import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the message sender',
  })
  @IsInt()
  @Min(1)
  senderId: number;

  @ApiProperty({
    example: 'Hello Rahul!',
    description: 'Message content',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}