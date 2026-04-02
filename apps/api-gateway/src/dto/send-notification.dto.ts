import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';

export class SendNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  toUserId: number;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  channels?: string[]; // e.g. ['EMAIL', 'PUSH']

  @IsOptional()
  variables?: Record<string, unknown>;
}
