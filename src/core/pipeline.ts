import { splitCodeBlocks, Segment } from '../utils/splitCode.js';
import { detectContext, ContextType } from '../utils/context.js';
import { removeFiller, FillerOptions } from '../rules/filler.js';
import { compressPhrases, PhraseOptions } from '../rules/phrases.js';
import { normalizeWhitespace, WhitespaceOptions } from '../rules/whitespace.js';
import { compressMarkdown } from '../rules/markdown.js';
import { lite } from '../presets/lite.js';
import { full } from '../presets/full.js';
import { ultra } from '../presets/ultra.js';
import { selectAutoMode } from '../presets/auto.js';

export type CompressMode = 'lite' | 'full' | 'ultra' | 'context' | 'auto';

export interface CompressOptions {
  /**
   * Compression mode preset (default: 'full')
   * Use 'context' for context-aware compression
   */
  mode?: CompressMode;
  /**
   * Filler word removal options (set to false to disable)
   */
  filler?: FillerOptions | false;
  /**
   * Phrase compression options (set to false to disable)
   */
  phrases?: PhraseOptions | false;
  /**
   * Whitespace normalization options (set to false to disable)
   */
  whitespace?: WhitespaceOptions | false;
  /**
   * When true, detect error messages and apply minimal compression
   * to preserve error details, stack traces, and debugging info
   */
  preserveErrors?: boolean;
  /**
   * When true, detect log messages and apply lighter compression
   * to preserve log structure, timestamps, and important details
   */
  preserveLogs?: boolean;
}

const MODE_PRESETS: Record<CompressMode, CompressOptions> = {
  lite,
  full,
  ultra,
  context: full, // Default for context mode (will be overridden per segment)
  auto: full,    // Default for auto mode (resolved dynamically)
};

/**
 * Maps context types to compression modes:
 * - error -> lite (minimal compression to preserve important details)
 * - code -> lite (preserve code explanations and context)
 * - explanation -> full (standard compression)
 * - normal -> ultra (aggressive compression)
 */
const CONTEXT_TO_MODE: Record<ContextType, CompressMode> = {
  error: 'lite',
  code: 'lite',
  explanation: 'full',
  normal: 'ultra',
};

/**
 * Compression pipeline that applies transformations to text segments
 * while preserving code blocks exactly as they appear.
 *
 * When mode is 'context', applies different compression levels based on detected context:
 * - error/code -> lite (minimal compression)
 * - explanation -> full (standard compression)
 * - normal -> ultra (aggressive compression)
 *
 * When mode is 'auto', dynamically selects compression based on input length and context:
 * - short text (< 100 chars) -> lite
 * - error/code context -> lite
 * - explanation context -> full
 * - medium normal text (100-500 chars) -> full
 * - long normal text (> 500 chars) -> ultra
 *
 * Markdown structure (headings, lists, tables, blockquotes) is preserved.
 * Only textual content within markdown elements is compressed.
 *
 * @param input - The markdown text to compress
 * @param options - Pipeline configuration options or mode string
 * @returns Compressed text with deterministic output
 */
export function compress(input: string, options?: CompressOptions | CompressMode): string {
  if (!input) return '';

  // Resolve options - handle auto mode by detecting the best mode
  const isModeString = typeof options === 'string';
  const baseMode = isModeString ? options : (options?.mode ?? 'full');
  const effectiveMode = baseMode === 'auto' ? selectAutoMode(input) : baseMode;
  // Merge base preset with any overrides
  const resolved = resolveOptions(options);
  const useContextAware = effectiveMode === 'context';
  // Selective preservation flags
  const usePreserveErrors = resolved.preserveErrors === true;
  const usePreserveLogs = resolved.preserveLogs === true;

  // Split input into code and text segments
  const segments = splitCodeBlocks(input);

  // Apply transformations to text segments
  const processed = segments.map((segment: Segment) => {
    if (segment.type === 'code') {
      // Preserve code blocks without modification
      return segment.content;
    }

    let text = segment.content;

    // Wrap compression logic to preserve markdown structure
    const applyCompression = (content: string): string => {
      let compressed = content;

      // Check if selective preservation applies
      if (usePreserveErrors || usePreserveLogs) {
        const context = detectContext(compressed);
        const shouldPreserve = (usePreserveErrors && context === 'error') ||
          (usePreserveLogs && isLogMessage(compressed));

        if (shouldPreserve) {
          // Apply only lite compression for preserved contexts
          const liteOptions = resolveOptions('lite');
          if (liteOptions.filler !== false) {
            compressed = removeFiller(compressed, liteOptions.filler);
          }
          if (liteOptions.phrases !== false) {
            compressed = compressPhrases(compressed, liteOptions.phrases);
          }
          if (liteOptions.whitespace !== false) {
            compressed = normalizeWhitespace(compressed, liteOptions.whitespace);
          }
          return compressed;
        }
      }

      if (useContextAware) {
        // Context-aware compression: detect context and apply appropriate level
        const context = detectContext(compressed);
        const contextMode = CONTEXT_TO_MODE[context];
        const contextOptions = resolveOptions(contextMode);

        if (contextOptions.filler !== false) {
          compressed = removeFiller(compressed, contextOptions.filler);
        }

        if (contextOptions.phrases !== false) {
          compressed = compressPhrases(compressed, contextOptions.phrases);
        }

        if (contextOptions.whitespace !== false) {
          compressed = normalizeWhitespace(compressed, contextOptions.whitespace);
        }
      } else {
        // Standard compression: use resolved options
        if (resolved.filler !== false) {
          compressed = removeFiller(compressed, resolved.filler);
        }

        if (resolved.phrases !== false) {
          compressed = compressPhrases(compressed, resolved.phrases);
        }

        if (resolved.whitespace !== false) {
          compressed = normalizeWhitespace(compressed, resolved.whitespace);
        }
      }

      return compressed;
    };

    // Apply markdown-aware compression: preserve structure, compress text
    text = compressMarkdown(text, applyCompression);

    return text;
  });

  // Recombine segments into final output
  return processed.join('');
}

/**
 * Resolves options from a mode string or CompressOptions object.
 * Merges mode preset with any overrides provided.
 */
function resolveOptions(options?: CompressOptions | CompressMode): CompressOptions {
  if (!options) return full;

  // If it's a mode string, use the corresponding preset
  if (typeof options === 'string') {
    return MODE_PRESETS[options] ?? full;
  }

  // If it's a CompressOptions object, merge with mode preset
  const mode = options.mode ?? 'full';
  const preset = MODE_PRESETS[mode] ?? full;

  // Merge preset with overrides (overrides take precedence)
  return {
    filler: options.filler ?? preset.filler,
    phrases: options.phrases ?? preset.phrases,
    whitespace: options.whitespace ?? preset.whitespace,
    preserveErrors: options.preserveErrors ?? preset.preserveErrors,
    preserveLogs: options.preserveLogs ?? preset.preserveLogs,
  };
}

/**
 * Detects if text is a log message based on common log patterns.
 * Logs typically have timestamps, log levels, and structured format.
 */
function isLogMessage(text: string): boolean {
  if (!text || !text.trim()) return false;

  const logPatterns = [
    // Timestamp patterns: 2024-01-01, Jan 01 2024, 12:30:45, etc.
    /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/,
    /^\w{3}\s+\d{1,2}\s+\d{4}/,
    /^\d{2}:\d{2}:\d{2}/,

    // Log level patterns: INFO, WARN, ERROR, DEBUG, etc.
    /\b(INFO|WARN|WARNING|ERROR|DEBUG|TRACE|FATAL|CRITICAL|NOTICE|VERBOSE)\b[\s:]/i,

    // Common log formats
    /\[\d{4}-\d{2}-\d{2}/,
    /\[(info|warn|error|debug|trace|fatal|critical)\]/i,
    /^\[?[A-Za-z]{3,10}\]?\s+\d{4}-\d{2}-\d{2}/,

    // Logger prefixes: [logger], logger:, app.js:, etc.
    /^\[?\w+\]?\s*[:.-]\s*\w/,
  ];

  return logPatterns.some((pattern) => pattern.test(text));
}
