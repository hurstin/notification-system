import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserServiceService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(data: {
    username: string;
    password: string;
  }): Promise<User> {
    // check if username exist
    const existingUser = await this.findByUsername(data.username);
    if (existingUser) {
      throw new NotAcceptableException('Username already exists');
    }
    const user = this.usersRepository.create({
      username: data.username,
      password: data.password,
    });
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async verifyCredentials(
    username: string,
    pass: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.findByUsername(username);
    // Note: Assuming pass is stored unhashed for this exact iteration
    // since we do NOT have bcrypt right now in this exact file if it was reverted
    if (user && user.password === pass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  getHello(): string {
    return 'User Service with TypeORM!';
  }
}
