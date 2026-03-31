import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class TemplateContentDto {
  @IsString()
  language: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateContentDto)
  contents: TemplateContentDto[];
}
