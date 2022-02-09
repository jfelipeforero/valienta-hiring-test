import Koa from 'koa';
import * as swagger from 'swagger2';
import { ui } from 'swagger2-koa';
import bodyParser from 'koa-bodyparser';
import helmet from 'koa-helmet';
import cors from '@koa/cors';
import loggingMiddleware from './middleware/loggingMiddleware';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import config from './config';
import logger from './logger';
import connect from './connection';

const app = new Koa();
const swaggerDocument: any = swagger.loadDocumentSync(`${__dirname}/swagger/v1/v1.yaml`);

// Provides important security headers to make your app more secure
app.use(helmet());

// Enable cors
app.use(cors({ exposeHeaders: ['Pagination-Total'] }));

// Logger middleware -> use winston as logger (logging.ts with config)
app.use(loggingMiddleware);

// Enable bodyParser with default options
app.use(bodyParser());

app.use(errorHandler);

app.use(ui(swaggerDocument, '/docs'));

app.use(routes.routes());

connect().then(() => {
  app.listen(config.port);
  logger.info(`Server running on port ${config.port}`);
}).catch((error: any) => logger.error('TypeORM connection error: ', error));

export default app;
