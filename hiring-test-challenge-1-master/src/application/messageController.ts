import StatusCodes from 'http-status-codes';
import { Between, getConnectionManager } from 'typeorm';
require('dotenv').config();

import Message from '../domain/message.entity';
import Alien from '../domain/alien.entity';
import Type from '../domain/type.entity';
import sendSlackNotification from '../gateway/slackIntegration';
import { BadRequestError } from '../errors';

const validateMessage = async (pmessage: string) => {
  const message: string[] = pmessage.split(' ').slice(0, -1);
  let decryptedMessage = [];
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const regexConsonants = /[bcdfghjklmnpqrstvwxyz]/gi;
  let firstLetter = message[0][0];
  for (let i = 0; i < message.length; i++) {
    if (message[i][0] !== firstLetter) {
      return {
        message: pmessage,
        valid: 'false',
        reason: `First letter ${message[i][0]} on index ${i}: "${message[i]}" should be equal to first letter ${firstLetter} on index 0 in order to be a valid message`,
        type_: 'Unknown',
        alienLeader_: 'Unknown',
      };
    } else if (message[i].slice(1).match(regexConsonants).length !== 3) {
      return {
        message: pmessage,
        valid: 'false',
        reason: `${message[i]} has ${
          message[i].slice(1).match(regexConsonants).length
        } consonants instead of 3`,
        type_: 'Unknown',
        alienLeader_: 'Unknown',
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
        valid: 'false',
        reason: `Decrypted message has more than 1 pattern, first ocurrence: ${firstPattern} at position ${0} and ${
          decryptedMessage[m]
        } at position ${m} in ${decryptedMessage}`,
        type_: 'Unknown',
        alienLeader: pmessage[0][0],
        alienLeader_: 'Unknown',
      };
    }
  }
  const typeRepo = getConnectionManager().get('my-connection').getRepository(Type);
  const typeID = await typeRepo.find({
    where: {
      value: firstPattern,
    },
  });
  const alienRepo = getConnectionManager().get('my-connection').getRepository(Alien);
  const alienLeaderID = await alienRepo.find({
    where: {
      value: pmessage[0][0],
    },
  });
  return {
    message: pmessage,
    valid: 'true',
    type: firstPattern,
    typeID: typeID[0].id,
    alienLeader: pmessage[0][0],
    alienLeaderID: alienLeaderID[0].id,
  };
};

const storeMessage = async (ctx): Promise<any> => {
  const incomingMessage = ctx.request.body.message;
  if (!incomingMessage) {
    throw new BadRequestError('No message provided');
  }

  const { message, valid, reason, type, typeID, alienLeader, alienLeaderID } =
    await validateMessage(incomingMessage);

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  const messageData = await messageRepo.create({
    created_at: Date(),
    content: message,
    valid,
    type: typeID,
    alienleader: alienLeaderID,
  });
  await messageRepo.save(messageData);

  ctx.request.query = {
    firstDate: Math.trunc(new Date().getTime() / 1000 - 3600),
    lastDate: Math.trunc(new Date().getTime() / 1000),
  };

  await getMessagesBetweenDates(ctx);

  if (ctx.body.messages.length >= 5) {
    let evaluated = [];
    for (let i = 0; i < ctx.body.messages.length; i++) {
      if (ctx.body.messages[i].alienleader !== null) {
        if (evaluated.includes(ctx.body.messages[i].alienleader.value) !== true) {
          let counter = 0;
          for (let j = i; j < ctx.body.messages.length; j++) {
            if (ctx.body.messages[j].alienleader !== null) {
              if (
                ctx.body.messages[i].alienleader.value === ctx.body.messages[j].alienleader.value &&
                ctx.body.messages[j].type.value === 'DANGER'
              ) {
                counter++;
                if (counter === 5) {
                  sendSlackNotification({
                    text: `Alien leader ${ctx.body.messages[j].alienleader.value} has sent 5 DANGER messages in the last hour`,
                  });
                }
              } else if (
                ctx.body.messages[i].alienleader.value === ctx.body.messages[j].alienleader.value &&
                ctx.body.messages[j].type.value !== 'DANGER'
              ) {
                counter = 0;
              }
            }
          }
          evaluated.push(ctx.body.messages[i].alienleader.value);
        }
      }
    }
  }

  ctx.status = StatusCodes.CREATED;
  ctx.body = { createdAt: messageData.created_at, message, valid, reason, type, alienLeader };
};

const getMessagesBetweenDates = async (ctx): Promise<any> => {
  const { firstDate, lastDate } = ctx.request.query;
  if (!firstDate || !lastDate) {
    throw new BadRequestError('Please provide the dates in which you want to do a search');
  }

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  const messages = await messageRepo.find({
    where: {
      created_at: Between(new Date(firstDate * 1000), new Date(lastDate * 1000)),
    },
    relations: ['type', 'alienleader'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages.length, messages };
};

const getAlienMessages = async (ctx): Promise<any> => {
  const { alienleader } = ctx.request.query;
  if (!alienleader) {
    throw new BadRequestError('Alien name not provided');
  }

  const alienRepo = getConnectionManager().get('my-connection').getRepository(Alien);
  const messages = await alienRepo.find({
    where: {
      value: alienleader,
    },
    relations: ['messages', 'messages.type'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages[0].messages.length, messages };
};

const getMessagesByType = async (ctx): Promise<any> => {
  const { messageType } = ctx.request.query;
  if (!messageType) {
    throw new BadRequestError('Message type not provided');
  }

  const typeRepo = getConnectionManager().get('my-connection').getRepository(Type);
  const messages = await typeRepo.find({
    where: {
      value: messageType,
    },
    relations: ['messages', 'messages.alienleader'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages[0].messages.length, messages };
};

const getMessagesByValidity = async (ctx): Promise<any> => {
  const { valid } = ctx.request.query;
  if (!valid) {
    throw new BadRequestError('Message validity not provided');
  }

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  if (valid === 'true') {
    const messages = await messageRepo.find({
      where: {
        valid: 'true',
      },
      relations: ['type', 'alienleader'],
    });
    ctx.status = StatusCodes.OK;
    ctx.body = { nbHits: messages.length, messages };
  } else if (valid === 'false') {
    const messages = await messageRepo.find({
      where: {
        valid: 'false',
      },
    });
    for (let i = 0; i < messages.length; i++) {
      const { reason } = await validateMessage(messages[i].content);
      messages[i]['reason'] = reason;
    }
    ctx.status = StatusCodes.OK;
    ctx.body = { nbHits: messages.length, messages };
  } else {
    throw new BadRequestError('Validity provided differ from established: ["true","false"]');
  }
};

const updateMessage = async (ctx): Promise<any> => {
  const { originalMessage, newMessage } = ctx.request.body;
  if (!originalMessage || !newMessage) {
    throw new BadRequestError('Please provide original message and new message');
  }

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  const messageData = await messageRepo.find({
    where: {
      content: originalMessage,
    },
  });

  if (messageData[0] === undefined) {
    throw new BadRequestError(`Not existing message with content: ${originalMessage}`);
  }

  const { message, valid, reason, type, typeID, alienLeader, alienLeaderID } =
    await validateMessage(newMessage);

  const originalMessageDate = new Date(messageData[0].created_at).getTime() / 1000.0 / 60;
  const currentDate = new Date().getTime() / 60000;
  const diffTime = currentDate - originalMessageDate;
  if (diffTime > 5) {
    throw new BadRequestError(
      `Message to replace must have been created in the last 5 minutos, time elapsed: ${Math.round(
        diffTime
      )} minutes`
    );
  }

  const messageUpdated = await messageRepo
    .createQueryBuilder()
    .update(Message)
    .set({
      created_at: Date(),
      content: newMessage,
      valid,
      type: typeID,
      alienleader: alienLeaderID,
    })
    .where({
      content: originalMessage,
    })
    .execute();

  ctx.status = StatusCodes.OK;
  ctx.body = {
    messageUpdated,
    newMessage: message,
    valid,
    reason,
    type,
    alienLeader,
  };
};

const deleteMessage = async (ctx): Promise<any> => {
  const { message } = ctx.request.body;
  if (!message) {
    throw new BadRequestError('Please provide message to delete');
  }

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  const messageDeleted = await messageRepo
    .createQueryBuilder()
    .delete()
    .from(Message)
    .where({ content: message })
    .execute();

  ctx.status = StatusCodes.OK;
  ctx.body = { messageDeleted };
};

export {
  storeMessage,
  getMessagesBetweenDates,
  getAlienMessages,
  getMessagesByType,
  getMessagesByValidity,
  updateMessage,
  deleteMessage,
};
