import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { sendMessage } from '../telegram';
import { buildSystemPrompt } from './system-prompt';
import { buildClientContext } from './context';
import { TOOLS } from './tools';
import { handleToolCall } from './tool-handlers';
import { checkRateLimit, checkSpam } from './rate-limit';
import type { ClientContext } from './types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = process.env.AI_OPERATOR_MODEL ?? 'claude-sonnet-4-6';
const MAX_TOKENS = Number(process.env.AI_OPERATOR_MAX_TOKENS ?? 1024);
const CONTEXT_SIZE = Number(process.env.AI_OPERATOR_CONTEXT_SIZE ?? 20);
const MAX_TOOL_ROUNDS = 5;
const MAX_MESSAGE_LENGTH = 1000;

// ---------------------------------------------------------------------------
// Anthropic client (singleton)
// ---------------------------------------------------------------------------

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// ---------------------------------------------------------------------------
// Conversation history helpers
// ---------------------------------------------------------------------------

type ApiMessage = Anthropic.MessageParam;

async function loadHistory(chatId: string): Promise<ApiMessage[]> {
  const result = await db.execute({
    sql: `SELECT role, content, tool_name, tool_use_id
          FROM telegram_messages
          WHERE chat_id = ?
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [chatId, CONTEXT_SIZE],
  });

  // Rows come newest-first, reverse to chronological
  const rows = result.rows.reverse();

  const messages: ApiMessage[] = [];
  for (const row of rows) {
    const role = String(row.role);
    const content = String(row.content);
    const toolName = row.tool_name ? String(row.tool_name) : undefined;
    const toolUseId = row.tool_use_id ? String(row.tool_use_id) : undefined;

    if (role === 'user') {
      messages.push({ role: 'user', content });
    } else if (role === 'assistant') {
      messages.push({ role: 'assistant', content });
    } else if (role === 'tool_use' && toolName && toolUseId) {
      // Reconstruct as assistant message with tool_use block
      const toolInput = safeJsonParse(content);
      messages.push({
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: toolUseId,
            name: toolName,
            input: toolInput,
          },
        ],
      });
    } else if (role === 'tool_result' && toolUseId) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseId,
            content,
          },
        ],
      });
    }
  }

  return messages;
}

async function saveMessage(
  chatId: string,
  role: string,
  content: string,
  toolName?: string,
  toolUseId?: string,
  tokensIn?: number,
  tokensOut?: number,
): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO telegram_messages (chat_id, role, content, tool_name, tool_use_id, tokens_in, tokens_out, model)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [chatId, role, content, toolName ?? null, toolUseId ?? null, tokensIn ?? 0, tokensOut ?? 0, MODEL],
    });
  } catch (error) {
    console.error('[telegram-ai] Failed to save message:', error);
  }
}

// ---------------------------------------------------------------------------
// Callback data → text translator
// ---------------------------------------------------------------------------

function callbackDataToText(data: string): string | null {
  // Booking flow callbacks — handled directly in telegram-bot.ts, never via AI
  if (data.startsWith('bk_')) return null;
  if (data.startsWith('girl:')) return data.slice(5);
  if (data.startsWith('time:')) return data.slice(5);
  if (data.startsWith('dur:')) return `${data.slice(4)} min`;
  if (data === 'confirm') return 'Potvrdit';
  if (data === 'cancel') return 'Zrusit';
  // Legacy confirm_booking callbacks handled separately
  if (data.startsWith('confirm_booking:')) return null;
  if (data.startsWith('schedule_remind:')) return null;
  return data;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleAIMessage(
  chatId: string,
  username: string | null,
  text: string,
): Promise<void> {
  try {
    // 1. Rate limit
    const rateLimitMsg = await checkRateLimit(String(chatId));
    if (rateLimitMsg) {
      await sendMessage(chatId, rateLimitMsg);
      return;
    }

    // 2. Spam check
    const isSpam = await checkSpam(String(chatId), text);
    if (isSpam) {
      return; // Silent ignore for spam
    }

    // 3. Truncate long messages
    const userText = text.length > MAX_MESSAGE_LENGTH
      ? text.substring(0, MAX_MESSAGE_LENGTH) + '...'
      : text;

    // 4. Build client context
    const ctx = await buildClientContext(String(chatId), username);

    if (ctx.isBanned) {
      await sendMessage(chatId, 'Tvuj ucet je zablokovany. Kontaktuj studio.');
      return;
    }

    // 5. Load conversation history
    const history = await loadHistory(String(chatId));

    // 6. Save user message
    await saveMessage(String(chatId), 'user', userText);

    // 7. Build messages array for Claude
    const messages: ApiMessage[] = [
      ...history,
      { role: 'user', content: userText },
    ];

    // 8. Call Claude API in a tool-use loop
    const systemPrompt = buildSystemPrompt(ctx);
    const client = getAnthropicClient();

    let finalText = '';
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
        tools: TOOLS,
      });

      totalTokensIn += response.usage.input_tokens;
      totalTokensOut += response.usage.output_tokens;

      // Process response content blocks
      const textBlocks: string[] = [];
      const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textBlocks.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      // If there are tool uses, process them
      if (toolUseBlocks.length > 0 && round < MAX_TOOL_ROUNDS) {
        // Add assistant message with all content blocks to conversation
        messages.push({ role: 'assistant', content: response.content });

        // Save tool_use messages
        for (const tu of toolUseBlocks) {
          await saveMessage(
            String(chatId), 'tool_use',
            JSON.stringify(tu.input), tu.name, tu.id,
          );
        }

        // Execute tools and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUseBlocks) {
          const result = await handleToolCall(tu.name, tu.input, ctx);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: result,
          });

          // Save tool_result
          await saveMessage(
            String(chatId), 'tool_result',
            result, tu.name, tu.id,
          );
        }

        // Add tool results as user message
        messages.push({ role: 'user', content: toolResults });

        // Continue loop for Claude to process tool results
        continue;
      }

      // No tool use (or max rounds reached) — extract final text
      if (textBlocks.length > 0) {
        finalText = textBlocks.join('\n');
      }

      break;
    }

    // 9. Save assistant response
    if (finalText) {
      await saveMessage(String(chatId), 'assistant', finalText, undefined, undefined, totalTokensIn, totalTokensOut);
    }

    // 10. Send response to Telegram
    if (finalText) {
      // Split long messages (TG limit is 4096 chars)
      const chunks = splitMessage(finalText, 4000);
      for (const chunk of chunks) {
        await sendMessage(chatId, chunk);
      }
    } else {
      await sendMessage(chatId, 'Omlouvam se, neco se pokazilo. Zkus to znovu.');
    }
  } catch (error) {
    console.error('[telegram-ai] Handler error:', error);
    try {
      await sendMessage(chatId, 'Omlouvam se, nastala chyba. Zkus to za chvili.');
    } catch {
      // Can't even send error message — give up
    }
  }
}

/**
 * Handle callback query from inline keyboard.
 * Translates callback_data to text and processes via AI.
 */
export async function handleAICallback(
  chatId: string,
  username: string | null,
  callbackData: string,
): Promise<void> {
  const text = callbackDataToText(callbackData);
  if (text) {
    await handleAIMessage(chatId, username, text);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      parts.push(remaining);
      break;
    }
    // Try to split at last newline before maxLen
    const chunk = remaining.substring(0, maxLen);
    const lastNl = chunk.lastIndexOf('\n');
    const splitAt = lastNl > maxLen / 2 ? lastNl : maxLen;
    parts.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trimStart();
  }
  return parts;
}

function safeJsonParse(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
