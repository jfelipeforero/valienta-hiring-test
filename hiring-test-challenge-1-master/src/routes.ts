import Router from 'koa-router';
import config from './config';
import {
  storeMessage,
  getAlienMessages,
  getMessagesBetweenDates,
  getMessagesByType,
  getMessagesByValidity,
  updateMessage,
  deleteMessage,
} from './application/index';

const routes = new Router();

//Message router
routes.post(`/${config.apiPrefix}/message`, storeMessage);
routes.get(`/${config.apiPrefix}/message/date`, getMessagesBetweenDates);
routes.get(`/${config.apiPrefix}/message`, getMessagesByValidity);

routes.patch(`/${config.apiPrefix}/message`, updateMessage);

routes.delete(`/${config.apiPrefix}/message`, deleteMessage);

//Messages by alien
routes.get(`/${config.apiPrefix}/message/alien`, getAlienMessages);

//Messages by type
routes.get(`/${config.apiPrefix}/message/type`, getMessagesByType);

export default routes;
