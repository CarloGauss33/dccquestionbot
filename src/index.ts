import dotenv from 'dotenv';
import SimpleNodeLogger from 'simple-node-logger';
import { Context, Telegraf } from 'telegraf';
import { Update, Message } from 'typegram';
import { get_completions } from './openai';

dotenv.config();
const log = SimpleNodeLogger.createSimpleLogger('logs/questions.log');

interface MessageContext extends Context<Update> {
  content?: string;
  username?: string;
}

const bot_token: string = process.env.TELEGRAM_TOKEN as string;
const bot: Telegraf<MessageContext> = new Telegraf(bot_token);

log.info('Bot started at: ' + new Date().toISOString());

bot.use((ctx, next) => {
  ctx.content = (ctx.message as Message.TextMessage)?.text;
  ctx.username = ctx.message?.from?.username;
  return next();
});

bot.start((ctx) => {
  log.info(`${ctx.username} - Start`);
  ctx.reply(`Hola ${ctx.username}!, ¿En qué puedo ayudarte?`);
});

bot.command('ask', async (ctx) => {
  log.info(`${ctx.username} - Ask: ${ctx.content}`);
  const parsed_message = ctx.content?.replace('/ask', '');
  
  if (parsed_message) {
    const answer = await get_completions(parsed_message) as string;
    log.info(`${ctx.username} - Answer: ${answer}`);
    ctx.reply(answer);
  } else {
    ctx.reply('Debes realizar una pregunta');
  }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));