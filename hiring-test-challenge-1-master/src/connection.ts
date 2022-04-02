import { createConnection, Connection, getConnectionManager } from 'typeorm';
import config from './config';
import Message from './domain/message.entity';
import Alien from './domain/alien.entity';
import Type from './domain/type.entity';

async function connect(): Promise<void> {
  await createConnection({
    name: 'my-connection',
    type: 'postgres',
    host: config.postgresDB.host,
    port: config.postgresDB.port,
    username: config.postgresDB.username,
    password: config.postgresDB.password,
    database: config.postgresDB.database,
    synchronize: false,
    subscribers: [],
    logger: 'simple-console',
    entities: [Message, Alien, Type],
  });
}

export default connect;
