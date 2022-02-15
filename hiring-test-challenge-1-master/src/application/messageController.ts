import { BaseContext } from 'koa';
import StatusCodes from 'http-status-codes';
import { Between, getRepository, OneToMany } from 'typeorm';
import CustomError from '../errors';
import SlackNotify from 'slack-notify';
const datefunc = require('../utils/datefunc');
const Alien = require('src/domain/alien.entity');
const Type = require('src/domain/type.entity');
const Message = require('src/domain/Message');

const messageRepo = getRepository(Message);
const typeRepo = getRepository(Type);
const alienRepo = getRepository(Alien);

const validateMessage = (pmessage) => {
  const message = pmessage.split(' ').slice(0, -1);
  let decryptedMessage = [];
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const regexConsonants = /[bcdfghjklmnpqrstvwxyz]/gi;
  let firstLetter = message[0][0];
  for (let i = 0; i < message.length; i++) {
    if (message[i][0] !== firstLetter) {
      return {
        message: pmessage,
        valid: false,
        reason: `First letter ${message[i][0]} on index ${i}: "${message[i]}" should be equal to first letter ${firstLetter} on index 0 in order to be a valid message`,
      };
    } else if (message[i].slice(1).match(regexConsonants).length !== 3) {
      return {
        message: pmessage,
        valid: false,
        reason: `${message[i]} has ${
          message[i].slice(1).match(regexConsonants).length
        } consonants instead of 3`,
      };
    }
  }
  for (let i = 0; i < message.length; i++) {
    let firstConsonant = false;
    let currentLetterValue = null;
    let currentPattern = null;
    let firstConsonantIndex = 0;
    for (let k = 1; firstConsonant !== true; k++) {
      if (message[i][k].match(regexConsonants) !== null) {
        firstConsonant = true;
        currentLetterValue = consonants.match(message[i][k]).index;
        firstConsonantIndex = k;
      }
    }
    for (let j = firstConsonantIndex + 1; j < message[i].length; j++) {
      if (message[i][j].match(regexConsonants) !== null) {
        if (
          (currentPattern === 'WARNING' &&
            consonants.match(message[i][j]).index > currentLetterValue) ||
          (currentPattern === 'DANGER' &&
            consonants.match(message[i][j]).index < currentLetterValue)
        ) {
          currentPattern = 'INFO';
          break;
        }
        if (consonants.match(message[i][j]).index > currentLetterValue) {
          currentPattern = 'DANGER';
          currentLetterValue = consonants.match(message[i][j]).index;
        } else currentPattern = 'WARNING';
        currentLetterValue = consonants.match(message[i][j]).index;
      }
    }
    decryptedMessage.push(currentPattern);
  }

  const firstPattern = decryptedMessage[0];
  for (let m = 1; m < decryptedMessage.length; m++) {
    if (decryptedMessage[m] !== firstPattern) {
      return {
        message: pmessage,
        valid: false,
        reason: `Decrypted message has more than 1 pattern, first ocurrence: ${firstPattern} at position ${0} and ${
          decryptedMessage[m]
        } at position ${m} in ${decryptedMessage}`,
      };
    }
  }
  return {
    message: pmessage,
    valid: true,
    type: firstPattern,
    alienLeader: pmessage[0][0],
  };
};

const storeMessage = async (ctx: BaseContext): Promise<void> => {
  const incomingMessage: string = ctx.body;
  if (!incomingMessage) {
    throw new CustomError.BadRequestError('No message provided');
  }
  const { message, valid, type, alienLeader } = validateMessage(incomingMessage);

  const messageData = messageRepo.create({ content: message, valid: valid });
  await messageRepo.save(messageData);

  const typeData = typeRepo.create({ value: type });
  await typeRepo.save(typeData);

  const alienData = alienRepo.create({ value: alienLeader });
  await alienRepo.save(alienData);

  ctx.status = StatusCodes.CREATED;
  ctx.body = { message, valid, type, alienLeader };
};

const getMessagesBetweenDates = async (ctx: BaseContext): Promise<void> => {
  const { firstDate, lastDate } = ctx.body;
  const messages = await messageRepo.find({
    where: {
      createdAt: Between(new Date(firstDate), new Date(lastDate)),
    },
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { messages };
};

const getAlienMessages = async (ctx: BaseContext): Promise<void> => {
  const alien = ctx.body.alien;
  if (!alien) {
    throw new CustomError.BadRequestError('Alien name not provided');
  }
  const messages = await alienRepo.find({
    where: {
      value: alien,
    },
    relations: ['messages'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { messages };
};

const getMessagesByType = async (ctx: BaseContext): Promise<void> => {
  const messageType = ctx.body.type;
  if (!messageType) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
  const messages = await typeRepo.find({
    where: {
      value: messageType,
    },
    relations: ['messages'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { messages };
};

const getMessagesByValidity = async (ctx: BaseContext): Promise<void> => {
  const valid = ctx.body;
  if (!valid) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
  if (valid === true) {
    const messages = await messageRepo.find({
      where: {
        valid: true,
      },
    });
    ctx.status = StatusCodes.OK;
    ctx.body = { messages };
  } else {
    const messages = await messageRepo.find({
      where: {
        valid: false,
      },
    });
    ctx.status = StatusCodes.OK;
    ctx.body = { messages };
  }
};

const updateMessage = async (ctx: BaseContext): Promise<void> => {
  const { oldMessage, newMessage } = ctx.body;
  if (!oldMessage || !newMessage) {
    throw new CustomError.BadRequestError('Please provide old message and new message');
  }
  const _ = await messageRepo.find({
    where: {
      message: oldMessage,
    },
  });
  if (!_) {
    throw new CustomError.NotFoundError(`No message with content: ${oldMessage}`);
  }
  const oldMessageDate = await messageRepo.find(oldMessage.createdAt);
  const currentDate = new Date();
  const diffTime = dateDiffInDays(oldMessage, currentDate) * 1440;
  if (diffTime > 5) {
    throw new CustomError.BadRequestError(
      `Message to replace must have been created in the last 5 minutos, time elapsed: ${diffTime}`
    );
  }
  const message = await messageRepo.update(
    {
      where: {
        message: oldMessage,
      },
    },
    newMessage
  );
};

export {
  validateMessage,
  storeMessage,
  getMessagesBetweenDates,
  getAlienMessages,
  getMessagesByType,
  getMessagesByValidity,
  updateMessage,
};
