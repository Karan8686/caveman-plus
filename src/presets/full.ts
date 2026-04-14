import { CompressOptions } from '../core/pipeline.js';

/**
 * Full compression mode
 * Standard changes: removes all default filler words,
 * applies default phrase compression, normalizes whitespace
 */
export const full: CompressOptions = {
  filler: {
    caseInsensitive: true,
  },
  phrases: {
    caseInsensitive: true,
  },
  whitespace: {
    normalizeLineEndings: true,
    trimTrailing: true,
    collapseNewlines: false,
  },
};
