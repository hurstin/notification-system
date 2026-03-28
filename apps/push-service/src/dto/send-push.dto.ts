import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl,
  IsObject,
} from 'class-validator';

export class SendPushDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tokens: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}
