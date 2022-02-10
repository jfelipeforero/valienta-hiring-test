import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// eslint-disable-next-line import/no-cycle
import Message from './Message';

// export enum MessageType {
//   INFO = 'INFO',
//   DANGER = 'DANGER',
//   WARNING = 'WARNING'

// }

@Entity({ name: 'type' })
export default class Type {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  constructor(
    warehouse: Warehouse,
    data: any,
    warehouseEventType: WarehouseEventType,
    hasBeenProcessed?: boolean,
    createdAt?: Date,
    id?: string
  ) {
    this.id = id;
    this.warehouse = warehouse;
    this.data = data;
    this.warehouseEventType = warehouseEventType;
    this.createdAt = createdAt;
    this.hasBeenProcessed = hasBeenProcessed;
  }
}
