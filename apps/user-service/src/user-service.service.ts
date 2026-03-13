import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserServiceService {
  // Mock Database of users
  private readonly users = [
    {
      userId: 1,
      username: 'testuser',
      // 'password123' hashed with bcrypt
      password: '$2b$10$qMl51e0pe7aTCm/5BIMRdONr0VhyNrkITTVU5ki79ViTBCwM9LYwS',
    },
  ];
// NEED TO BE FIXED 10
  findByUsername(username: string): UserDto | undefined {
    return this.users.find((user) => user.username === username);
  }
// NEED TO BE FIXED 11
  async verifyCredentials(
    username: string,
    pass: string,
  ): Promise<UserDto | null> {
    const user = this.findByUsername(username);

    // NEED TO BE FIXED 12
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as UserDto; // Return the user object if passwords match
    }

    return null; // Invalid credentials
  }

  getHello(): string {
    return 'Hello World!';
  }
}
