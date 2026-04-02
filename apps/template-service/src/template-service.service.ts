import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateContent } from './entities/template-content.entity';
import * as Handlebars from 'handlebars';
import { RpcException } from '@nestjs/microservices';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(TemplateVersion)
    private versionRepo: Repository<TemplateVersion>,
    @InjectRepository(TemplateContent)
    private contentRepo: Repository<TemplateContent>,
  ) {}

  async getTemplate(name: string, lang: string = 'en', variables: any = {}) {
    const template = await this.templateRepo.findOne({
      where: { name },
      relations: ['versions', 'versions.contents'],
    });

    if (!template) {
      throw new RpcException({
        status: 404,
        message: `Template ${name} not found`,
      });
    }

    const currentVersion = template.versions.find((v) => v.isCurrent);
    if (!currentVersion) {
      throw new RpcException({
        status: 404,
        message: `No current version for template ${name}`,
      });
    }

    let content = currentVersion.contents.find((c) => c.language === lang);
    if (!content && lang !== 'en') {
      content = currentVersion.contents.find((c) => c.language === 'en');
    }

    if (!content) {
      throw new RpcException({
        status: 404,
        message: `Content for language ${lang} not found`,
      });
    }

    const compiledSubject = Handlebars.compile(content.subject);
    const compiledBody = Handlebars.compile(content.body);

    return {
      subject: compiledSubject(variables),
      body: compiledBody(variables),
      versionId: currentVersion.id,
      versionNumber: currentVersion.versionNumber,
    };
  }

  async createTemplate(data: CreateTemplateDto) {
    const existingTemplate = await this.templateRepo.findOne({
      where: { name: data.name },
    });

    if (existingTemplate) {
      throw new RpcException({
        status: 400,
        message: `Template ${data.name} already exists`,
      });
    }

    const template = this.templateRepo.create({
      name: data.name,
      description: data.description,
    });

    const version = this.versionRepo.create({
      versionNumber: 1,
      isCurrent: true,
    });

    version.contents = data.contents.map((c) => this.contentRepo.create(c));
    template.versions = [version];

    return this.templateRepo.save(template);
  }

  async updateTemplate(
    name: string,
    data: { contents: { language: string; subject: string; body: string }[] },
  ) {
    const template = await this.templateRepo.findOne({
      where: { name },
      relations: ['versions'],
    });

    if (!template) {
      throw new RpcException({
        status: 404,
        message: `Template ${name} not found`,
      });
    }

    // Mark current version as not current
    const currentVersion = template.versions.find((v) => v.isCurrent);
    if (currentVersion) {
      currentVersion.isCurrent = false;
      await this.versionRepo.save(currentVersion);
    }

    const newVersionNumber = (currentVersion?.versionNumber || 0) + 1;
    const newVersion = this.versionRepo.create({
      versionNumber: newVersionNumber,
      isCurrent: true,
      template,
      contents: data.contents.map((c) => this.contentRepo.create(c)),
    });

    return this.versionRepo.save(newVersion);
  }

  async listTemplates() {
    const template = await this.templateRepo.find();
    if (!template || template.length === 0) {
      throw new RpcException({ status: 404, message: `Template not found` });
    }
    return template;
  }

  async deleteTemplate(name: string) {
    const template = await this.templateRepo.findOne({ where: { name } });
    if (!template) {
      throw new RpcException({
        status: 404,
        message: `Template ${name} not found`,
      });
    }
    return this.templateRepo.remove(template);
  }
}
