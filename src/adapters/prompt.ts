import { CompressMode } from '../core/pipeline.js';

export interface PromptOptions {
  /**
   * Compression mode: lite, full, ultra
   */
  mode?: CompressMode;
  /**
   * Domain context to preserve (e.g., 'medical', 'legal', 'technical')
   */
  domain?: string;
  /**
   * Additional custom instructions to append to the prompt
   */
  customInstructions?: string[];
}

const MODE_DESCRIPTIONS: Record<CompressMode, string> = {
  lite: 'Minimal compression: remove only obvious filler words, keep sentences mostly intact',
  full: 'Standard compression: remove filler words, shorten verbose phrases, clean up whitespace',
  ultra: 'Maximum compression: aggressively shorten text while preserving core meaning',
  context: 'Context-aware compression: apply different compression levels based on detected content type (error/code=light, explanation=medium, normal=aggressive)',
  auto: 'Automatic selection: dynamically choose compression level based on text length and context type',
};

const MODE_INSTRUCTIONS: Record<CompressMode, string> = {
  lite: `- Remove only the most obvious filler words: "just", "very", "really"
- Keep sentence structure and phrasing largely unchanged
- Preserve technical terms, jargon, and domain-specific language`,

  full: `- Remove filler words: "actually", "basically", "just", "very", "really", "literally", etc.
- Replace verbose phrases with shorter equivalents (e.g., "in order to" → "to")
- Remove unnecessary hedging phrases like "it is important to note that"
- Clean up extra spacing and normalize whitespace`,

  ultra: `- Remove all filler words and hedging language
- Aggressively compress verbose phrases to their shortest equivalents
- Replace long expressions with direct, concise alternatives
- Use short words over long ones where possible (e.g., "use" over "utilize")
- Collapse excessive whitespace and trailing spaces`,

  context: `- Automatically detect content type and apply appropriate compression:
  * Error messages and stack traces: light compression (preserve critical details)
  * Code snippets and explanations: light compression (preserve technical accuracy)
  * Explanatory text: medium compression (balance clarity and brevity)
  * Normal conversation: aggressive compression (minimize token usage)
- Always preserve code blocks, technical terms, and domain-specific language
- Never modify content inside code blocks`,

  auto: `- Automatically select compression level based on input characteristics:
  * Short text (< 100 characters): light compression to preserve content
  * Error messages and code: light compression (preserve technical details)
  * Explanations and documentation: medium compression (balance clarity and brevity)
  * Medium-length normal text (100-500 chars): standard compression
  * Long verbose text (> 500 characters): aggressive compression for efficiency
- Always preserve code blocks, technical terms, and domain-specific language`,
};

/**
 * Generates a system prompt that instructs AI models to compress their responses.
 * Compatible with AI tools like Antigravity, Qwen, and other LLM interfaces.
 *
 * @param options - Configuration for the prompt
 * @returns A system prompt string for AI model instruction
 */
export function getPrompt(options?: PromptOptions | CompressMode): string {
  const resolved = resolvePromptOptions(options);
  const mode = resolved.mode;

  const parts: string[] = [
    'You are a text compression assistant. Your task is to compress responses by removing unnecessary words while preserving all technical meaning.',
    '',
    '## Core Rules',
    '1. Remove filler words and verbose phrases',
    '2. Keep all technical terms, code, data, and domain-specific language exactly as written',
    '3. Preserve the original meaning and intent of the response',
    '4. Do not modify content inside code blocks, tables, or formatted sections',
    '5. Maintain readability and proper grammar',
    '',
    '## Compression Level',
    MODE_DESCRIPTIONS[mode],
    '',
    '## Specific Instructions',
    MODE_INSTRUCTIONS[mode],
  ];

  if (resolved.domain) {
    parts.push(
      '',
      `## Domain Context: ${resolved.domain}`,
      `Preserve all terminology, conventions, and phrasing specific to the ${resolved.domain} domain.`,
      'Do not oversimplify or lose nuance in domain-specific content.'
    );
  }

  if (resolved.customInstructions && resolved.customInstructions.length > 0) {
    parts.push(
      '',
      '## Additional Instructions',
      ...resolved.customInstructions
    );
  }

  return parts.join('\n');
}

/**
 * Resolves prompt options from a mode string or PromptOptions object.
 */
function resolvePromptOptions(
  options?: PromptOptions | CompressMode
): Required<Pick<PromptOptions, 'mode' | 'domain' | 'customInstructions'>> {
  if (!options || typeof options === 'string') {
    return {
      mode: options as CompressMode || 'full',
      domain: '',
      customInstructions: [],
    };
  }

  return {
    mode: options.mode ?? 'full',
    domain: options.domain ?? '',
    customInstructions: options.customInstructions ?? [],
  };
}
