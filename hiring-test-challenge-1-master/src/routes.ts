import Router from 'koa-router';
import config from './config';
import controller from './application/index';
import { storeMessage,getAlienMessages,getMessagesBetweenDates, getMessagesByType, getMessagesByValidity, updateMessage } from './application/messageController';

const routes = new Router();

routes.post(`/${config.apiPrefix}`,storeMessage,getAlienMessages,getMessagesBetweenDates,getMessagesByType,getMessagesByValidity)
routes.patch(`/${config.apiPrefix}`,updateMessage);

export default routes;
