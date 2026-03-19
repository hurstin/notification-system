import { IsNotEmpty } from 'class-validator';
import { Match, NotMatch } from '../../common/decorators/match.decorator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  currentPassword: string;

  @IsNotEmpty()
  @NotMatch('currentPassword', {
    message: 'New password cannot be same as current password',
  })
  newPassword: string;

  @IsNotEmpty()
  @Match('newPassword', { message: 'new and confirm passwords do not match' })
  confirmPassword: string;
}
