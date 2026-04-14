import { CompressMode } from './pipeline.js';
import { removeFiller } from '../rules/filler.js';
import { compressPhrases } from '../rules/phrases.js';
import { normalizeWhitespace } from '../rules/whitespace.js';
import { lite } from '../presets/lite.js';
import { full } from '../presets/full.js';
import { ultra } from '../presets/ultra.js';

/**
 * Streaming compression state.
 * Tracks incomplete sentences and code block boundaries across chunks.
 */
export interface StreamState {
  /**
   * Buffered incomplete text waiting for a sentence boundary
   */
  buffer: string;
  /**
   * Whether we are currently inside a code block
   */
  inCodeBlock: boolean;
}

function createStreamState(): StreamState {
  return { buffer: '', inCodeBlock: false };
}

const MODE_PRESETS: Record<CompressMode, typeof lite> = { lite, full, ultra, context: full, auto: full };

/**
 * Applies compression to a stream state with the given chunk.
 * Designed for incremental processing: avoids aggressive transformations
 * that require full context, and safely handles mid-sentence boundaries.
 *
 * Only returns newly compressed output for each call.
 * Use finalizeStream() to flush remaining buffered text.
 *
 * @param chunk - New text chunk to process
 * @param state - Streaming state from previous call (omit for first call)
 * @param mode - Compression mode (default: 'full')
 * @returns Newly compressed text and updated state
 */
export function compressStream(
  chunk: string,
  state?: StreamState,
  mode: CompressMode = 'full'
): { output: string; state: StreamState } {
  const s = state ?? createStreamState();

  if (!chunk) return { output: '', state: s };

  // If inside a code block, look for the closing fence
  if (s.inCodeBlock) {
    return handleCodeBlockChunk(chunk, s);
  }

  // Look for an opening code fence
  const openIndex = chunk.indexOf('```');
  if (openIndex !== -1) {
    return handleOpenFence(chunk, openIndex, s, mode);
  }

  // Normal text: process with sentence boundary awareness
  return handleTextChunk(chunk, s, mode);
}

/**
 * Handles a chunk while inside a code block.
 */
function handleCodeBlockChunk(
  chunk: string,
  state: StreamState
): { output: string; state: StreamState } {
  const closeIndex = chunk.indexOf('```');

  if (closeIndex === -1) {
    // Still inside code block, accumulate
    state.buffer += chunk;
    return { output: '', state };
  }

  // Code block closes here
  const codeEnd = closeIndex + 3;
  const codeContent = chunk.slice(0, codeEnd);
  const afterCode = chunk.slice(codeEnd);

  state.inCodeBlock = false;

  // Flush code block as-is (never modify code)
  let output = state.buffer + codeContent;
  state.buffer = '';

  // Process any text after the closing fence
  if (afterCode) {
    const result = handleTextChunk(afterCode, state, 'full');
    output += result.output;
    // Merge state back
    state.buffer = result.state.buffer;
    state.inCodeBlock = result.state.inCodeBlock;
  }

  return { output, state };
}

/**
 * Handles a chunk that contains an opening code fence.
 */
function handleOpenFence(
  chunk: string,
  openIndex: number,
  state: StreamState,
  mode: CompressMode
): { output: string; state: StreamState } {
  // Process text before the fence
  const textBefore = chunk.slice(0, openIndex);
  const textResult = handleTextChunk(textBefore, state, mode);

  // Check if there's a closing fence in the remainder
  const afterFence = chunk.slice(openIndex + 3);
  const closeIndex = afterFence.indexOf('```');

  if (closeIndex !== -1) {
    // Complete code block in this chunk
    const codeContent = afterFence.slice(0, closeIndex + 3);
    const afterCode = afterFence.slice(closeIndex + 3);

    const output = textResult.output + '```' + codeContent;

    if (afterCode) {
      const result = handleTextChunk(afterCode, state, mode);
      return { output: output + result.output, state };
    }

    return { output, state };
  }

  // Code block continues to next chunk — only store code content in buffer
  state.inCodeBlock = true;
  state.buffer = '```' + afterFence;
  return { output: textResult.output, state };
}

/**
 * Handles a normal text chunk with sentence boundary awareness.
 * Only compresses complete sentences; buffers the rest.
 */
function handleTextChunk(
  chunk: string,
  state: StreamState,
  mode: CompressMode
): { output: string; state: StreamState } {
  const preset = MODE_PRESETS[mode] ?? MODE_PRESETS.full;

  // Combine buffered text with new chunk
  const combined = state.buffer + chunk;
  state.buffer = '';

  // Find the last safe sentence boundary
  const boundary = findLastSentenceBoundary(combined);

  if (boundary === -1) {
    // No complete sentence, buffer everything
    state.buffer = combined;
    return { output: '', state };
  }

  // Split into compressible part and remainder
  const complete = combined.slice(0, boundary);
  const remainder = combined.slice(boundary);

  // Apply compression
  const compressed = applyStreamSafeCompression(complete, preset);

  // Ensure trailing space on compressed output if remainder starts without one
  const needsSpace = compressed.length > 0 && remainder.length > 0 && !remainder.startsWith('\n');
  state.buffer = remainder;

  return { output: needsSpace ? compressed + ' ' : compressed, state };
}

/**
 * Finds the last sentence boundary in text.
 * Returns index after the last complete sentence, or -1 if none found.
 */
function findLastSentenceBoundary(text: string): number {
  // Paragraph boundary: double newline followed by non-newline
  const paraMatch = text.match(/\n\n(?=[^\n])/);
  const paraIndex = paraMatch?.index ?? -1;

  // Sentence boundary: punctuation followed by space and capital letter
  const sentMatch = text.match(/[.!?][ \t\n]+(?=[A-Z])/);
  const sentIndex = sentMatch
    ? (sentMatch.index as number) + sentMatch[0].length - 1
    : -1;

  const boundary = Math.max(paraIndex, sentIndex);
  if (boundary === -1) return -1;

  return boundary + 1;
}

/**
 * Applies stream-safe compression (doesn't require full context).
 */
function applyStreamSafeCompression(
  text: string,
  preset: typeof lite | typeof full | typeof ultra
): string {
  let result = text;

  if (preset.filler !== false) {
    result = removeFiller(result, preset.filler);
  }

  if (preset.phrases !== false) {
    result = compressPhrases(result, preset.phrases);
  }

  if (preset.whitespace !== false) {
    result = normalizeWhitespace(result, preset.whitespace);
  }

  return result;
}

/**
 * Finalizes a streaming compression session.
 * Flushes any remaining buffered text with final compression.
 *
 * @param state - The final streaming state
 * @param mode - Compression mode used
 * @returns Remaining compressed text (empty if nothing buffered)
 */
export function finalizeStream(
  state: StreamState,
  mode: CompressMode = 'full'
): string {
  if (!state.buffer) return '';

  const preset = MODE_PRESETS[mode] ?? MODE_PRESETS.full;

  // Unclosed code block: return as-is
  if (state.inCodeBlock) return state.buffer;

  const result = applyStreamSafeCompression(state.buffer, preset);
  state.buffer = '';
  return result;
}
