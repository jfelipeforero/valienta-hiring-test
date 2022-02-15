import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// eslint-disable-next-line import/no-cycle
import Message from './message.entity';

@Entity({ name: 'type' })
export default class Type {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column()
  messageId: number;

  @OneToOne(() => Message, (message) => message.type, { onDelete: 'CASCADE' })
  @JoinColumn()
  message: Message[];

  constructor(id?: string, value?: string) {
    (this.id = id), (this.value = value);
  }
}
