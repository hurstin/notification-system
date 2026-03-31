import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TemplateVersion } from './template-version.entity';

@Entity()
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Internal name or slug (e.g., 'welcome-email')

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => TemplateVersion, (version) => version.template, {
    cascade: true,
  })
  versions: TemplateVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
