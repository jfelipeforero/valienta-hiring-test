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
import WarehouseEvent from './Type';

@Entity({ name: 'message' })
export default class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @Column()
  type: string;

  @Column()
  alienLeader: string;

  @OneToMany(() => WarehouseEvent, (event) => event.warehouse, {})
  warehouseEvents: WarehouseEvent[];

  @VersionColumn()
  version: number;

  constructor(id?: string, message?: string, alien?: string, messageType?: string, type?: string) {
    this.id = id;
    this.alien = alien;
    this.type = type;
  }
}
