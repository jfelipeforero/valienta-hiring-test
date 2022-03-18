import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import Message from './message.entity';

@Entity({ name: 'alien' })
export default class Alien {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;
  @OneToMany(() => Message, (message) => message.alienleader)
  messages: string;
}
