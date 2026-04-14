import { CompressOptions } from '../core/pipeline.js';

/**
 * Lite compression mode
 * Minimal changes: removes only the most obvious filler words,
 * skips phrase compression, normalizes basic whitespace
 */
export const lite: CompressOptions = {
  filler: {
    fillers: ['just', 'very', 'really'],
    caseInsensitive: true,
  },
  phrases: false,
  whitespace: {
    normalizeLineEndings: true,
    trimTrailing: true,
    collapseNewlines: false,
  },
};
