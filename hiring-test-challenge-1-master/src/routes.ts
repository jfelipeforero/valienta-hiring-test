import Router from 'koa-router';
import config from './config';
import controller from './application/index';
import { getAlienMessages } from './application/messageController';

const routes = new Router();

routes.get(`/${config.apiPrefix}/health/ping`, getAlienMessages);
routes.post;
routes.patch(`/${config.apiPrefix}`);

export default routes;
