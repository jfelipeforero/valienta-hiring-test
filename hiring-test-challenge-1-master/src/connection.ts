import { createConnection, Connection } from 'typeorm';
import config from './config';

async function connect(): Promise<Connection> {
  return createConnection({
    type: 'postgres',
    host: config.postgresDB.host,
    port: config.postgresDB.port,
    username: config.postgresDB.username,
    password: config.postgresDB.password,
    database: config.postgresDB.database,
    synchronize: false,
    subscribers: [],
    logger: 'simple-console',
    entities: [
      `${__dirname}/domain/*.js`,
      `${__dirname}/domain/*.ts`
    ]
  });
}

export default connect;
