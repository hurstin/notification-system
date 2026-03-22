import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';

describe('ApiGatewayController', () => {
  let apiGatewayController: ApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGatewayController],
      providers: [
        ApiGatewayService,
        {
          provide: 'USER_SERVICE',
          useValue: {}, // mock client
        },
      ],
    }).compile();

    apiGatewayController = app.get<ApiGatewayController>(ApiGatewayController);
  });

  it('should be defined', () => {
    expect(apiGatewayController).toBeDefined();
  });
});
