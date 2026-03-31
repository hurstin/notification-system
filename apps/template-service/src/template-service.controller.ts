import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TemplateService } from './template-service.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller()
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @MessagePattern({ cmd: 'get_template' })
  async getTemplate(
    @Payload() data: { name: string; lang?: string; variables?: any },
  ) {
    return this.templateService.getTemplate(
      data.name,
      data.lang,
      data.variables,
    );
  }

  @MessagePattern({ cmd: 'create_template' })
  async createTemplate(@Payload() data: CreateTemplateDto) {
    return this.templateService.createTemplate(data);
  }

  @MessagePattern({ cmd: 'update_template' })
  async updateTemplate(
    @Payload()
    data: {
      name: string;
      contents: { language: string; subject: string; body: string }[];
    },
  ) {
    return this.templateService.updateTemplate(data.name, data);
  }

  @MessagePattern({ cmd: 'list_templates' })
  async listTemplates() {
    return this.templateService.listTemplates();
  }
}
