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
} from './application/messageController';

const routes = new Router();

//Message router
routes.post(`/${config.apiPrefix}/message`, storeMessage);
routes.get(`/${config.apiPrefix}/message/date`, getMessagesBetweenDates);
routes.get(`/${config.apiPrefix}/message`, getMessagesByValidity);

routes.patch(`/${config.apiPrefix}/message`, updateMessage);

routes.delete(`/${config.apiPrefix}/message`, deleteMessage);

//Alien router
routes.post(`/${config.apiPrefix}/alien`, getAlienMessages);

//Type router
routes.post(`/${config.apiPrefix}/type`, getMessagesByType);

export default routes;
