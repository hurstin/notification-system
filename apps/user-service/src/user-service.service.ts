import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

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

  async findByUsername(username: string): Promise<any | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async verifyCredentials(username: string, pass: string): Promise<any | null> {
    const user = await this.findByUsername(username);
    
    if (user && await bcrypt.compare(pass, user.password)) {
      return user; // Return the user object if passwords match
    }
    
    return null; // Invalid credentials
  }

  getHello(): string {
    return 'Hello World!';
  }
}
