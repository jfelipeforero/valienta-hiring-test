import {
  Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';

// eslint-disable-next-line import/no-cycle
import Warehouse from './Warehouse';

import WarehouseEventType from './WarehouseEventType';

@Entity({ name: 'warehouse_event' })
export default class WarehouseEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Warehouse, (warehouse) => warehouse.id, { nullable: false })
    @JoinColumn({
      name: 'warehouse_id'
    })
    warehouse: Warehouse;

    @Column({
      type: 'jsonb',
      name: 'data'
    })
    data: any;

    @ManyToOne(() => WarehouseEventType, (warehouseEventType) => warehouseEventType.id, { nullable: false })
    @JoinColumn({
      name: 'warehouse_event_type_id'
    })
    warehouseEventType: WarehouseEventType;

    @Generated()
    @Column({
      type: 'timestamptz',
      name: 'created_at'
    })
    createdAt: Date;

    @Column({
      type: 'boolean',
      name: 'has_been_processed'
    })
    hasBeenProcessed: boolean;

    constructor(warehouse: Warehouse, data: any, warehouseEventType: WarehouseEventType, hasBeenProcessed?: boolean, createdAt?: Date, id?: string) {
      this.id = id;
      this.warehouse = warehouse;
      this.data = data;
      this.warehouseEventType = warehouseEventType;
      this.createdAt = createdAt;
      this.hasBeenProcessed = hasBeenProcessed;
    }
}
