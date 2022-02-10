import { BaseContext } from 'koa';
import StatusCodes from 'http-status-codes';
import { Between, getRepository, OneToMany } from 'typeorm';
import CustomError from '../errors';
const Type = require('src/domain/Type')
const Message = require('src/domain/Message');

const messageRepo = getRepository(Message)
const typeRepo = getRepository(Type)

async function ping(ctx: BaseContext): Promise<void> {
  ctx.status = StatusCodes.OK;
  ctx.body = { pong: 'pong' };
}

const validateMessage = (message_:string): { message:string;valid: boolean; reason?: string;type?:string;alienLeader?:string } => {
  const message = message_.split(' ')
  let decryptedMessage: string[];
  const consonants: string = 'bcdfghjklmnpqrstvwxyz';
  const regexConsonants: RegExp = /[bcdfghjklmnpqrstvwxyz]/gi;
  let firstLetter: string = message[0][0];
  for (let i = 0; i < message.length; i++) {
    if (message[i][0] !== firstLetter) {
      return {
        message:message_,
        valid:false,
        reason:`${message[i][0]} should be equal to ${firstLetter} to be a valid message`
      };
    }
    else if(message[i].slice(1).match(regexConsonants).length !== 3){
      return {
        message:message_,
        valid:false,
        reason:`${message[i]} has a number of consonants other than 3`
      }
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

  const firstPattern: string = decryptedMessage[0];
  for (let m = 1; m < decryptedMessage.length; m++) {
    if (decryptedMessage[m] !== firstPattern) {
      return {
        message:message_,
        valid: false,
        reason: `Decrypted message has more than 1 pattern, first ocurrence: ${firstPattern} at position ${1} and ${
          decryptedMessage[m]
        } at position ${m} in ${decryptedMessage}`,
      };
    }
  }
  return {
    message:message_,
    valid: true,
    type:firstPattern,
    alienLeader:firstPattern[0]

  };
};

const storeMessage = async (ctx:BaseContext): Promise<void> => {
  const message: string = ctx.body;
  if (!message) {
    throw new CustomError.BadRequestError('No message provided');
  }
  const data = validateMessage(message)
  messageRepo.create(data);
  ctx.status = StatusCodes.CREATED
  ctx.body = {data}
};

const getMessagesBetweenDates = async (ctx:BaseContext): Promise<void> => {
  const { firstDate, lastDate } = ctx.body;
  const messages = await messageRepo.find({
    where: {
      createdAt: Between(new Date(firstDate), new Date(lastDate)),
    },
  });
  ctx.status = StatusCodes.OK
  ctx.body = {messages}
};

const getAlienMessages = async (ctx): Promise<void> => {
  const alienID = ctx.body.alien;
  if (!alienID) {
    throw new CustomError.BadRequestError('Alien name not provided');
  }
  const messages = await messageRepo.find({
    where: {
      alien: alienID,
    },
  });
  ctx.status = StatusCodes.OK
  ctx.body = {messages}
};

const getMessagesByType = async (ctx:BaseContext): Promise<void> => {
  const messageTypeID = ctx.body.type;
  if (!messageTypeID) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
  const messages = await messageRepo.find({
    where: {
      type: messageTypeID,
    },
  });
  ctx.status = StatusCodes.OK
  ctx.body = {messages}
};

const getMessagesByValidity = async (ctx:BaseContext): Promise<void> => {
  const validity = ctx.body;
  if (!validity) {
    throw new CustomError.BadRequestError('Message type not provided');
  }
  if(validity===true){
    const messages = await messageRepo.find({
      where:{
        valid:true
      }
    })
    ctx.status = StatusCodes.OK
    ctx.body = {messages}
  }
  else {
    const messages = await messageRepo.find({
      where: {
        valid: false
      }
    })
    ctx.status = StatusCodes.OK
    ctx.body = {messages}
  }
};

const updateMessage = async(ctx:BaseContext):Promise<void>=>{
  const {oldMessage,newMessage} = ctx.body
  if(!oldMessage || !newMessage){
    throw new CustomError.BadRequestError('Please provide old message and new message')
  }
  const _ = await messageRepo.find({
    where:{
      _id:oldMessage
    }
  })
  const oldMessageDate = await messageRepo.find(oldMessage.createdAt)
  const diffTime = (Math.abs(Stringnew Date()-oldMessageDate))/60000
  if(diffTime>5){
    throw new CustomError.BadRequestError(`Message to replace must be created in the last 5 minutos, time elapsed: ${diffTime}`)
  }
  const message = await messageRepo.update(oldMessage,newMessage)
  if(!message){
    throw new CustomError.NotFoundError(`No message with content: ${oldMessage}`)
  }
}

export {
  validateMessage,
  storeMessage,
  getMessagesBetweenDates,
  getAlienMessages,
  getMessagesByType,
  getMessagesByValidity,
  updateMessage
};
