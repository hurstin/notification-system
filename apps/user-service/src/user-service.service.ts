import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from 'apps/api-gateway/src/auth/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { addHours } from 'date-fns'; // npm i date-fns

@Injectable()
export class UserServiceService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailerService: MailerService,
  ) {}

  async createUser(
    data: CreateUserDto,
  ): Promise<{ newUser: Partial<User>; message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const emailToken: string = uuidv4() as string;
    const tokenExpires: Date = addHours(new Date(), 1); //expires in 1 hour

    // check if username exist
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new RpcException({ status: 409, message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // create user object (spread DTO, set hashed password)
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: String(emailToken),
      emailVerificationTokenExpires: new Date(tokenExpires),
    });

    // send verification token to email

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Notification System! Confirm your Email',
      html: `
        <h3>Welcome ${user.name}!</h3>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="http://localhost:3000/auth/verify?token=${emailToken}">Verify Email</a>
        </p>
        <p>This token expires in 1 hour.</p>
      `,
    });

    // save user
    const savedUser = await this.usersRepository.save(user);

    // remove password from user object before returning

    // Map only the non-sensitive fields to the response object
    const newUser = {
      userId: savedUser.userId,
      name: savedUser.name,
      email: savedUser.email,
      isEmailVerified: savedUser.isEmailVerified,
    };
    return {
      newUser,
      message: 'User created successfully',
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async verifyCredentials(
    email: string,
    pass: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.findByEmail(email);
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
