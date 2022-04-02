import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Message from './message.entity';

@Entity({ name: 'type' })
export default class Type {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;
  @OneToMany(() => Message, (message) => message.type)
  messages: string;
}
