import dotenv from 'dotenv';
import SimpleNodeLogger from 'simple-node-logger';
import { Context, Telegraf, Format } from 'telegraf';
import { Update, Message } from 'typegram';
import { getChatAnswer, getTextsEmbedding } from './openai';
import { generateCourseReviewSummary, createCourseReview, getCoursesInMessage } from './reviews';

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

async function fetchOpenaiAnswer(
  question: string,
  username: string = '' ) {
  if (question.length < 1) {
    return 'Debes realizar una pregunta';
  }

  return await getChatAnswer(question, username) as string;
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

  return message.replace('/ask', '').replace(`@${BOT_USERNAME}`, '').replace('/review', '').replace('/addReview', '').trim();
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
  const answer = await fetchOpenaiAnswer(
    parsedMessage as string,
    ctx.username as string
  );

  log.info(`${ctx.username} - Answer: ${answer}`);

  await ctx.reply(
    answer,
    { reply_to_message_id: ctx.messageId }
  );
});

bot.command('embed', async (ctx) => {
  log.info(`${ctx.username} - Embed: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const answer = await getTextsEmbedding([parsedMessage as string]);

  log.info(`${ctx.username} - Answer: ${answer}`);

  await ctx.reply(
    JSON.stringify(answer),
    { reply_to_message_id: ctx.messageId }
  );
});

bot.command('fetchReview', async (ctx) => {
  log.info(`${ctx.username} - Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const [courseCode, ...content] = parsedMessage.split(' ');
  const answer = await generateCourseReviewSummary(courseCode, content.join(' '));

  log.info(`${ctx.username} - Answer: ${answer}`);

  await ctx.reply(
    answer,
    { reply_to_message_id: ctx.messageId }
  );
});

bot.command('review', async (ctx) => {
  log.info(`${ctx.username} - Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const courseCodes = await getCoursesInMessage(parsedMessage);

  if (courseCodes.length === 0) {
    await ctx.reply(
      'No se encontraron cursos en el mensaje',
      { reply_to_message_id: ctx.messageId }
    );
    return;
  }

  const response = [];
  for (const courseCode of courseCodes) {
    const answer = await generateCourseReviewSummary(courseCode, parsedMessage);
    response.push(answer);
  }

  if (response.length === 0) {
    await ctx.reply(
      'No se encontraron cursos en el mensaje',
      { reply_to_message_id: ctx.messageId }
    );
    return;
  }

  await ctx.reply(
    response.map((answer, index) => `${courseCodes[index]}:\n ${answer}`).join('\n\n'),
    { reply_to_message_id: ctx.messageId }
  );
});

bot.command('addReview', async (ctx) => {
  log.info(`${ctx.username} - Add Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const [courseCode, ...content] = parsedMessage.split(' ');
  const answer = await createCourseReview(courseCode, content.join(' '), ctx.username as string);

  log.info(`${ctx.username} - Answer: ${answer}`);
  await ctx.reply(
    `Se añadio la review al curso ${courseCode} correctamente`,
    { reply_to_message_id: ctx.messageId }
  );
});


bot.launch();