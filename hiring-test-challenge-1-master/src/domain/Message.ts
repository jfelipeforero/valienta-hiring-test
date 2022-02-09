import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  VersionColumn,
  Generated,
} from 'typeorm';

// eslint-disable-next-line import/no-cycle
import WarehouseEvent from './Table';

@Entity({ name: 'messages' })
export default class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @Column()
  alien: string;

  @Column()
  messageType: string;

  @Column()
  type: string;

  @OneToMany(() => WarehouseEvent, (event) => event.warehouse, {})
  warehouseEvents: WarehouseEvent[];

  @VersionColumn()
  version: number;

  constructor(id?: string, message?: string, alien?: string, messageType?: string, type?: string) {
    this.id = id;
    this.message = message;
    this.alien = alien;
    this.messageType = messageType;
    this.type = type;
  }
}
