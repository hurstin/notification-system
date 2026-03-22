import { IsNotEmpty, IsString } from 'class-validator';
import { ToLowerCase } from '../../common/decorators/to-lowercase.decorator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  email: string;
}
