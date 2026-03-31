import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';
import { TemplateContent } from './template-content.entity';

@Entity()
export class TemplateVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  versionNumber: number;

  @Column({ default: false })
  isCurrent: boolean;

  @ManyToOne(() => NotificationTemplate, (template) => template.versions, {
    onDelete: 'CASCADE',
  })
  template: NotificationTemplate;

  @OneToMany(() => TemplateContent, (content) => content.version, {
    cascade: true,
  })
  contents: TemplateContent[];

  @CreateDateColumn()
  createdAt: Date;
}
