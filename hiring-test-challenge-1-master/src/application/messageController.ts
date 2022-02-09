import { BaseContext } from 'koa';
import StatusCodes from 'http-status-codes';
import { Between, getRepository } from 'typeorm';
import CustomError from '../errors';
const Message = require('src/domain/Message');

async function ping(ctx: BaseContext): Promise<void> {
  ctx.status = StatusCodes.OK;
  ctx.body = { pong: 'pong' };
}

const messageLogic = (ctx: any): void => {
  let decryptedMessage: string[];
  const consonants: string = 'bcdfghjklmnpqrstvwxyz';
  const regexConsonants: RegExp = /[bcdfghjklmnpqrstvwxyz]/gi;
  const message: string[] = ctx.req.body;
  let firstLetter: string = message[0][0];
  for (let i = 0; i < message.length; i++) {
    if (message[i][0] !== firstLetter || message[i].slice(1).match(regexConsonants).length !== 3) {
      ctx.status(StatusCodes.BAD_REQUEST);
    }
  }
  for (let i = 0; i < message.length; i++) {
    let firstConsonant: boolean = false;
    let currentLetterValue: number = null;
    let currentPattern: string = null;
    for (let k = 1; firstConsonant !== true; k++) {
      if (message[i][k].match(regexConsonants) !== null) {
        firstConsonant = true;
        currentLetterValue = consonants.match(message[i][k]).index;
      }
    }
    for (let j = 2; j < message[i].length; j++) {
      if (message[i][j].match(regexConsonants) !== null) {
        if (
          (currentPattern === 'DESCENDING' &&
            consonants.match(message[i][j]).index > currentLetterValue) ||
          (currentPattern === 'ASCENDING' &&
            consonants.match(message[i][j]).index < currentLetterValue)
        ) {
          currentPattern = 'INFO';
          break;
        }
        if (consonants.match(message[i][j]).index > currentLetterValue) {
          currentPattern = 'ASCENSING';
          currentLetterValue = consonants.match(message[i][j]).index;
        } else currentPattern = 'DESCENDING';
        currentLetterValue = consonants.match(message[i][j]).index;
      }
    }
    decryptedMessage.push(currentPattern);
  }

  let check: string = decryptedMessage[0];
  for (let m = 1; m < decryptedMessage.length; m++) {
    if (decryptedMessage[m] !== check) {
      ctx.res.status(StatusCodes.BAD_REQUEST);
    }
  }
  ctx.res.body(decryptedMessage);
};

const storeMessage = async (ctx): Promise<void> => {
  const messageRepo = getRepository(Message);
  const message: string[] = ctx.req.body;
  if (!message) {
    throw new CustomError.BadRequestError('No message provided');
  }
  messageRepo.create(message);
  ctx.res.status(StatusCodes.CREATED).json({ message });
};

const getMessagesBetweenDates = async (ctx): Promise<void> => {
  const messageRepo = getRepository(Message);
  const { firstDate, lastDate } = ctx.req.body;
  const messages = await messageRepo.find({
    where: {
      createdAt: Between(new Date(firstDate), new Date(lastDate)),
    },
  });
  ctx.res.status(StatusCodes.OK).json({ messages });
};

const getAlienMessages = async (ctx): Promise<void> => {
  const messageRepo = getRepository(Message);
  const alienID = ctx.req.body.alien;
  if (!alienID) {
    throw new CustomError.BadRequestError('Alien name not provided');
  }
  const messages = await messageRepo.find({
    where: {
      alien: alienID,
    },
  });
  ctx.res.status(StatusCodes.OK).json({ messages });
};

const getMessagesByType = async (ctx): Promise<void> => {
  const messageRepo = getRepository(Message);
  const messageTypeID = ctx.req.body.type;
  if (!messageTypeID) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
  const messages = await messageRepo.find({
    where: {
      type: messageTypeID,
    },
  });
  ctx.res.status(StatusCodes.OK).json({ messages });
};

const getMessagesByValidity = async (ctx): Promise<void> => {
  const messageRepo = getRepository(Message);
  const message = ctx.req.body;
  if (!message) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
};

export default {
  messageLogic,
};
