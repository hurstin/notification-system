import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @OneToOne(() => User, (user) => user.notificationPreference, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
