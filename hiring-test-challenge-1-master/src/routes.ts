import Router from 'koa-router';
import config from './config';
import controller = require('./application/index');

const routes = new Router();

routes.get(`/${config.apiPrefix}/health/ping`, controller.messageController());

export default routes;
