import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, any>;

  @IsString()
  @IsOptional()
  lang?: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
