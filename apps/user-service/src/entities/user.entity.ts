import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

import { NotificationPreference } from './notification-preference.entity';
import { DeviceToken } from './device-token.entity';
import { NotificationHistory } from './notification-history.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @OneToOne(() => NotificationPreference, (preference) => preference.user, {
    cascade: true,
  })
  notificationPreference: NotificationPreference;

  @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.user, {
    cascade: true,
  })
  deviceTokens: DeviceToken[];

  @OneToMany(() => NotificationHistory, (notification) => notification.user, {
    cascade: true,
  })
  notifications: NotificationHistory[];

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationTokenExpires: Date | null;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetTokenExpires: Date | null;

  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  @Exclude()
  passwordChangedAt: Date | null;
}
