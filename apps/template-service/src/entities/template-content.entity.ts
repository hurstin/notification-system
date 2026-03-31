import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TemplateVersion } from './template-version.entity';

@Entity()
export class TemplateContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  language: string; // e.g., 'en', 'es', 'fr'

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @ManyToOne(() => TemplateVersion, (version) => version.contents, {
    onDelete: 'CASCADE',
  })
  version: TemplateVersion;
}
