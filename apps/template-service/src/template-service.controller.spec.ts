/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template-service.controller';
import { TemplateService } from './template-service.service';
import { CreateTemplateDto } from './dto/create-template.dto';

describe('TemplateController', () => {
  let controller: TemplateController;
  let service: TemplateService;

  const mockTemplateService = {
    getTemplate: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    listTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        {
          provide: TemplateService,
          useValue: mockTemplateService,
        },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
    service = module.get<TemplateService>(TemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getTemplate on service', async () => {
    mockTemplateService.getTemplate.mockResolvedValue('template');
    const result = await controller.getTemplate({
      name: 'test',
      lang: 'en',
      variables: {},
    });
    expect(service.getTemplate).toHaveBeenCalledWith('test', 'en', {});
    expect(result).toBe('template');
  });

  it('should call createTemplate on service', async () => {
    const dto: CreateTemplateDto = { name: 'test', contents: [] };
    mockTemplateService.createTemplate.mockResolvedValue('created');
    const result = await controller.createTemplate(dto);
    expect(service.createTemplate).toHaveBeenCalledWith(dto);
    expect(result).toBe('created');
  });

  it('should call updateTemplate on service', async () => {
    mockTemplateService.updateTemplate.mockResolvedValue('updated');
    const dto = { name: 'test', contents: [] };
    const result = await controller.updateTemplate(dto);
    expect(service.updateTemplate).toHaveBeenCalledWith('test', dto);
    expect(result).toBe('updated');
  });

  it('should call listTemplates on service', async () => {
    mockTemplateService.listTemplates.mockResolvedValue(['t1']);
    const result = await controller.listTemplates();
    expect(service.listTemplates).toHaveBeenCalled();
    expect(result).toEqual(['t1']);
  });
});
