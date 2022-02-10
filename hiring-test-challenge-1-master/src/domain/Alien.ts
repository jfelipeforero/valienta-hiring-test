import { Column, Entity, PrimaryGeneratedColumn, } from 'typeorm';

@Entity({ name: 'warehouse_event_type' })
export default class WarehouseEventType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text'
  })
  value: string;

  constructor(value: string, id?: string) {
    this.id = id;
    this.value = value;
  }
}
