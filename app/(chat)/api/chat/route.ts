import { type Message, convertToCoreMessages, createDataStreamResponse, streamText } from 'ai';

import { auth } from '@/app/(auth)/auth';
import { deleteChatById, getChatById, saveChat, saveMessages } from '@/lib/db/queries';
import { generateUUID, getMostRecentUserMessage, sanitizeResponseMessages } from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { SUPERVISOR_SYSTEM_PROMPT } from '@/lib/ai/agents/supervisor';
import { research } from '@/lib/ai/agents/researcher';
import { shop } from '@/lib/ai/agents/shopper';
import { myProvider } from '@/lib/ai/models';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { id, messages, selectedChatModel }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel('chat-model-large'),
        system: SUPERVISOR_SYSTEM_PROMPT,
        messages: convertToCoreMessages(messages),
        maxSteps: 20,
        maxRetries: 3,
        experimental_generateMessageId: generateUUID,
        experimental_continueSteps: true,
        tools: {
          researcher: research(dataStream),
          shopper: shop(dataStream),
        },
        onStepFinish(event) {
          // console.log('onStepFinish', event);
        },
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                }),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });

      const steps = await result.steps;
      // console.dir(steps, { depth: null });
      // console.log('total steps', steps.length);
    },
    onError: (error) => {
      console.log(error);
      return 'Oops, an error occured!';
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
