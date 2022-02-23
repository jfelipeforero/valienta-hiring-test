import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import Alien from './alien.entity';
import Type from './type.entity';

// eslint-disable-next-line import/no-cycle

@Entity({ name: 'message' })
export default class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  created_at: Date;

  @Column()
  content: string;

  @Column()
  valid: string;

  @ManyToOne(() => Type, (type) => type.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'typeid' })
  type: string;

  @ManyToOne(() => Alien, (alienLeader) => alienLeader.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'alienleaderid' })
  alienleader: string;
}
