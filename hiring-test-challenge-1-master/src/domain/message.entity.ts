import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  VersionColumn,
  Generated,
  OneToOne,
} from 'typeorm';
import Alien from './alien.entity';
import Type from './type.entity';

// eslint-disable-next-line import/no-cycle

@Entity({ name: 'message' })
export default class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  valid: boolean;

  @OneToOne(() => Type)
  type: Type;

  @ManyToOne((type) => Alien, (alien) => alien.messages, { onDelete: 'SET NULL' })
  alienLeader: Alien;
}
//   constructor(
//     id?: string,
//     message?: string,
//     alien?: string,
//     messageType?: string,
//     type?: string,
//     valid?: boolean
//   ) {
//     this.id = id;
//     this.content = content;
//     this.alienLeader = alien;
//     this.type = type;
//     this.valid = valid;
//   }
// }
