import dotenv from 'dotenv';
import SimpleNodeLogger from 'simple-node-logger';
import { Context, Telegraf } from 'telegraf';
import { Update, Message } from 'typegram';
import { getChatAnswer, getTextsEmbedding } from './services/openai';
import { generateCourseReviewSummary, createCourseReview, getCoursesInMessage, generateCourseReviewStats } from './services/reviews';

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

function parseTelegramMessage(message: string | undefined) {
  if (!message) {
    return '';
  }

  return message.replace('/ask', '').replace(`@${BOT_USERNAME}`, '').replace('/review', '').replace('/addReview', '').trim();
}

async function replyToMessage(message: string, ctx: MessageContext) {
  try {
    await ctx.reply(message, { reply_to_message_id: ctx.messageId });
  } catch (error) {
    log.error(error);
  }
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

  await replyToMessage(answer, ctx);
});

bot.command('embed', async (ctx) => {
  log.info(`${ctx.username} - Embed: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const answer = await getTextsEmbedding([parsedMessage as string]);

  log.info(`${ctx.username} - Answer: ${answer}`);

  await replyToMessage(JSON.stringify(answer), ctx);
});

bot.command('fetchReview', async (ctx) => {
  log.info(`${ctx.username} - Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const [courseCode, ...content] = parsedMessage.split(' ');
  const answer = await generateCourseReviewSummary(courseCode, content.join(' '));

  log.info(`${ctx.username} - Answer: ${answer}`);

  await replyToMessage(answer, ctx);
});

bot.command('review', async (ctx) => {
  log.info(`${ctx.username} - Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const courseCodes = await getCoursesInMessage(parsedMessage);

  log.info(`CourseCodesInMessage - Answer: ${courseCodes}`);

  if (!courseCodes || courseCodes.length === 0 || courseCodes[0].length === 0) {
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
    await replyToMessage(
      'No se encontraron cursos en el mensaje',
      ctx
    );
    return;
  }

  await replyToMessage(
    response.map((answer, index) => `${courseCodes[index]}:\n ${answer}`).join('\n\n'),
    ctx
  );
});

bot.command('addReview', async (ctx) => {
  log.info(`${ctx.username} - Add Review: ${ctx.content}`);

  const parsedMessage = parseTelegramMessage(ctx.content);
  const [courseCode, ...content] = parsedMessage.split(' ');
  const answer = await createCourseReview(courseCode, content.join(' '), ctx.username as string);

  log.info(`${ctx.username} - Answer: ${answer}`);
  await replyToMessage(
    `Se añadio la review al curso ${courseCode} correctamente`,
    ctx
  );
});

bot.command('stats', async (ctx) => {
  log.info(`${ctx.username} - Stats: ${ctx.content}`);

  const answer = await generateCourseReviewStats();

  log.info(`${ctx.username} - Answer: ${answer}`);
  await replyToMessage(
    answer,
    ctx
  );
});


bot.launch();