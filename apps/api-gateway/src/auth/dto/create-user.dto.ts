import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';
import { ToLowerCase } from '../../common/decorators/to-lowercase.decorator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ToLowerCase()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ToLowerCase()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Password and confirm password do not match' })
  passwordConfirm: string;
}
