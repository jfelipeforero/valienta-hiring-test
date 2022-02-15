import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import Message from './message.entity';

@Entity({ name: 'alienLeader' })
export default class Alien {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column()
  messageId: string;

  @OneToMany(() => Message, (message) => message.alienLeader)
  @JoinColumn()
  messages: Message[];

  constructor(value: string, id?: string) {
    this.id = id;
    this.value = value;
  }
}
