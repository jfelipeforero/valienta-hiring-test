import StatusCodes from 'http-status-codes';
import { Between, getConnectionManager } from 'typeorm';
require('dotenv').config();

import Message from '../domain/message.entity';
import Alien from '../domain/alien.entity';
import Type from '../domain/type.entity';
import sendSlackNotification from '../gateway/slackIntegration';

const typesID = {
  INFO: 'ed2a7e06-8798-4bae-b655-c62fe6e91ace',
  WARNING: '768731af-563f-4ba4-bf98-946d29a9170a',
  DANGER: 'b76a4e3d-f04d-4714-8d54-1c7dd1b50db4',
};

const aliensID = {
  B: '4a2d4fdc-9e48-46f4-80ea-7532462b98ae',
  C: '5ad1c305-5f27-4686-934f-8eb0000ff91e',
  D: '5d4fc74e-cfca-4470-99ad-5daad65501bf',
  F: '61a4780e-777f-4a5e-aab6-852f6fb13af4',
  G: 'fb9fd09f-a2b9-46ba-aaac-48f3c53e97f3',
  H: '713b395b-9bd8-4543-a17e-6c7e6e9575d6',
  J: '65f2f7d6-9a23-4836-89e9-db13c8212d4d',
  K: '21a5b7c8-709b-41a7-b890-e0a85247e8bb',
  L: '97d2cf7e-645f-45e6-8ffa-07af0480ce9f',
  M: 'cb8d30f4-a88f-4349-ac2a-bfac86398e40',
  N: '402c8b05-b1d9-41de-917c-638a80084315',
  P: '1480a0eb-1cfa-4bb2-9f4d-20ebe35d5058',
  Q: '3843d930-9eff-46d4-a5cd-26bdaa095f45',
  R: 'eacb6d51-7ac2-419b-8c6c-8aa0dae0980b',
  S: '196f0b29-093e-416a-8bb4-015280d123a0',
  T: '92ab447d-8738-4224-9db9-d342a0a38ba8',
  V: 'c67ad7e5-f8ee-46e0-9581-aa01ef57621e',
  W: 'd7d697e0-49d5-4ef5-a674-91983a0ee7a7',
  X: '178684a2-75da-4e61-a0bc-b26116a6e74d',
  Y: '5f9ae0ee-93c0-479d-a8c8-615d04e66058',
  Z: 'e95cd4ee-4f61-48ec-b874-df01604d1748',
};

const validateMessage = (pmessage: string) => {
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
  return {
    message: pmessage,
    valid: 'true',
    type: firstPattern,
    typeID: typesID[firstPattern],
    alienLeader: pmessage[0][0],
    alienLeaderID: aliensID[pmessage[0][0]],
  };
};

const storeMessage = async (ctx): Promise<boolean> => {
  const incomingMessage = ctx.request.body.message;

  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  if (!incomingMessage) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'No message provided' };
    return false;
  }
  const { message, valid, reason, type, typeID, alienLeader, alienLeaderID } =
    validateMessage(incomingMessage);

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
                    text: `${ctx.body.messages[j].alienleader.value} alien leader has sent 5 DANGER messages in the last hour`,
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

const getMessagesBetweenDates = async (ctx): Promise<boolean> => {
  const { firstDate, lastDate } = ctx.request.query;
  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);

  if (!firstDate || !lastDate) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Please provide the dates in which you want to do a search' };
    return false;
  }

  const messages = await messageRepo.find({
    where: {
      created_at: Between(new Date(firstDate * 1000), new Date(lastDate * 1000)),
    },
    relations: ['type', 'alienleader'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages.length, messages };
};

const getAlienMessages = async (ctx): Promise<boolean> => {
  const alien = ctx.request.body.alien;
  const alienRepo = getConnectionManager().get('my-connection').getRepository(Alien);
  if (!alien) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Alien name not provided' };
    return false;
  }
  const messages = await alienRepo.find({
    where: {
      value: alien,
    },
    relations: ['messages'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages[0].messages.length, messages };
};

const getMessagesByType = async (ctx): Promise<any> => {
  const messageType = ctx.request.body.type;
  const typeRepo = getConnectionManager().get('my-connection').getRepository(Type);
  if (!messageType) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Message type not provided' };
    return false;
  }
  const messages = await typeRepo.find({
    where: {
      value: messageType,
    },
    relations: ['messages'],
  });
  ctx.status = StatusCodes.OK;
  ctx.body = { nbHits: messages[0].messages.length, messages };
};

const getMessagesByValidity = async (ctx): Promise<any> => {
  const { valid } = ctx.request.query;
  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);

  if (!valid) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Message validity not provided' };
    return false;
  }
  if (valid === 'true') {
    const messages = await messageRepo.find({
      where: {
        valid: 'true',
      },
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
      const { reason } = validateMessage(messages[i].content);
      messages[i]['reason'] = reason;
    }
    ctx.status = StatusCodes.OK;
    ctx.body = { nbHits: messages.length, messages };
  } else {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Validity provided differ from established: ["true","false"]' };
    return false;
  }
};

const updateMessage = async (ctx): Promise<any> => {
  const { originalMessage, newMessage } = ctx.request.body;
  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);

  if (!originalMessage || !newMessage) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Please provide original message and new message' };
    return false;
  }
  const messageData = await messageRepo.find({
    where: {
      content: originalMessage,
    },
  });
  console.log(messageData, typeof messageData);

  if (!messageData) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: `Not existing message with content ${originalMessage}` };
    return false;
  }

  const { message, valid, reason, type, typeID, alienLeader, alienLeaderID } =
    validateMessage(newMessage);

  const originalMessageDate = new Date(messageData[0].created_at).getTime() / 1000.0 / 60;
  const currentDate = new Date().getTime() / 60000;
  const diffTime = currentDate - originalMessageDate;
  if (diffTime > 5) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = {
      error: `Message to replace must have been created in the last 5 minutos, time elapsed: ${Math.round(
        diffTime
      )} minutes`,
    };
    return false;
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
  ctx.body = { messageUpdated };
};

const deleteMessage = async (ctx): Promise<boolean> => {
  const { message } = ctx.request.body;
  const messageRepo = getConnectionManager().get('my-connection').getRepository(Message);
  if (!message) {
    ctx.status = StatusCodes.BAD_REQUEST;
    ctx.body = { err: 'Please provide message to delete' };
    return false;
  }
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
