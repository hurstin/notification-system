import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateContent } from './entities/template-content.entity';
import { RpcException } from '@nestjs/microservices';

describe('TemplateService', () => {
  let service: TemplateService;

  const mockTemplateRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockVersionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockContentRepo = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepo,
        },
        {
          provide: getRepositoryToken(TemplateVersion),
          useValue: mockVersionRepo,
        },
        {
          provide: getRepositoryToken(TemplateContent),
          useValue: mockContentRepo,
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTemplate', () => {
    it('should throw RpcException if template not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);
      await expect(service.getTemplate('not-found')).rejects.toThrow(
        RpcException,
      );
    });

    it('should throw RpcException if no current version found', async () => {
      const mockTemplate = {
        name: 'test',
        versions: [{ isCurrent: false }],
      };
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      await expect(service.getTemplate('test')).rejects.toThrow(RpcException);
    });

    it('should return compiled template with handlebars variables', async () => {
      const mockTemplate = {
        name: 'test',
        versions: [
          {
            isCurrent: true,
            id: 1,
            versionNumber: 1,
            contents: [
              {
                language: 'en',
                subject: 'Hello {{name}}',
                body: 'Body {{name}}',
              },
            ],
          },
        ],
      };
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplate('test', 'en', { name: 'World' });
      expect(result).toEqual({
        subject: 'Hello World',
        body: 'Body World',
        versionId: 1,
        versionNumber: 1,
      });
    });

    it('should fallback to en template if requested language is missing', async () => {
      const mockTemplate = {
        name: 'test',
        versions: [
          {
            isCurrent: true,
            id: 1,
            versionNumber: 1,
            contents: [
              { language: 'en', subject: 'Hello en', body: 'Body en' },
            ],
          },
        ],
      };
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplate('test', 'es', {}); // requested 'es'
      expect(result).toEqual({
        subject: 'Hello en',
        body: 'Body en',
        versionId: 1,
        versionNumber: 1,
      });
    });
  });

  describe('createTemplate', () => {
    it('should throw when template already exists', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({});
      await expect(
        service.createTemplate({ name: 'existing', contents: [] }),
      ).rejects.toThrow(RpcException);
    });

    it('should create template safely', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);
      mockTemplateRepo.create.mockReturnValue({ name: 'new', versions: [] });
      mockVersionRepo.create.mockReturnValue({
        isCurrent: true,
        versionNumber: 1,
        contents: [],
      });
      mockContentRepo.create.mockReturnValue({});
      mockTemplateRepo.save.mockResolvedValue('success');

      const result = await service.createTemplate({
        name: 'new',
        contents: [{ language: 'en', subject: 's', body: 'b' }],
      });
      expect(result).toBe('success');
      expect(mockTemplateRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    it('should throw when template not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateTemplate('missing', { contents: [] }),
      ).rejects.toThrow(RpcException);
    });

    it('should create new version and mark previous as outdated', async () => {
      const existingTemplate = {
        name: 'test',
        versions: [{ isCurrent: true, versionNumber: 1 }],
      };
      mockTemplateRepo.findOne.mockResolvedValue(existingTemplate);
      mockVersionRepo.create.mockReturnValue({
        isCurrent: true,
        versionNumber: 2,
      });
      mockVersionRepo.save.mockResolvedValue('saved_new_version');

      const result = await service.updateTemplate('test', { contents: [] });
      expect(existingTemplate.versions[0].isCurrent).toBe(false);
      expect(mockVersionRepo.save).toHaveBeenCalledWith(
        existingTemplate.versions[0],
      );
      expect(result).toBe('saved_new_version');
    });
  });

  describe('listTemplates', () => {
    it('should return templates', async () => {
      mockTemplateRepo.find.mockResolvedValue(['t1']);
      const res = await service.listTemplates();
      expect(res).toEqual(['t1']);
    });

    it('should throw if no templates found', async () => {
      mockTemplateRepo.find.mockResolvedValue([]);
      await expect(service.listTemplates()).rejects.toThrow(RpcException);
    });
  });
});
