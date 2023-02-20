import dotenv from 'dotenv';
import SimpleNodeLogger from 'simple-node-logger';
import { Context, Telegraf, Format } from 'telegraf';
import { Update, Message } from 'typegram';
import { getCompletions } from './openai';

dotenv.config();

const BOT_USERNAME = process.env.BOT_NAME || '';
const BROADCAST_CHAT_ID = process.env.BROADCAST_CHAT_ID || '';

const log = SimpleNodeLogger.createSimpleLogger('logs/questions.log');

interface MessageContext extends Context<Update> {
  content?: string;
  username?: string;
  messageId?: number;
}

const bot_token: string = process.env.TELEGRAM_TOKEN as string;
const bot: Telegraf<MessageContext> = new Telegraf(bot_token);
const telegram = bot.telegram;

log.info('Bot started at: ' + new Date().toISOString());

async function fetchOpenaiAnswer(question: string) {
  if (question.length > 0) {
    return await getCompletions(question) as string;
  }

  return 'Debes realizar una pregunta';
}

async function sendGoodbyeMessage() {
  if (!BROADCAST_CHAT_ID) {
    return;
  }

  await telegram.sendMessage(BROADCAST_CHAT_ID, 'Me voy a dormir... 😴');
}

function parseTelegramMessage(message: string | undefined) {
  if (!message) {
    return '';
  }

  return message.replace('/ask', '').replace(`@${BOT_USERNAME}`, '');
}

bot.use((ctx, next) => {
  ctx.content = (ctx.message as Message.TextMessage)?.text;
  ctx.username = ctx.message?.from?.username;
  ctx.messageId = ctx.message?.message_id;
  return next();
});

bot.start((ctx) => {
  ctx.reply(`Hola @${ctx.username}!, ¿En qué puedo ayudarte?`);
});

bot.command('ask', async (ctx) => {
  log.info(`${ctx.username} - Ask: ${ctx.content}`);
  const parsedMessage = parseTelegramMessage(ctx.content);
  const answer = await fetchOpenaiAnswer(parsedMessage as string);

  log.info(`${ctx.username} - Answer: ${answer}`);

  await ctx.replyWithHTML(
    answer,
    { reply_to_message_id: ctx.messageId }
  );
});


bot.launch();
process.once('SIGINT', async () => {
  await sendGoodbyeMessage();
  bot.stop('SIGINT');
  log.info('Bot stopped at: ' + new Date().toISOString());
});

process.once('SIGTERM', async () => {
  await sendGoodbyeMessage();
  bot.stop('SIGTERM');
  log.info('Bot stopped at: ' + new Date().toISOString());
});