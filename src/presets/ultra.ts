import { CompressOptions } from '../core/pipeline.js';

/**
 * Ultra compression mode
 * Maximum changes: removes all fillers, applies aggressive phrase compression,
 * collapses newlines, and adds custom aggressive replacements
 */
export const ultra: CompressOptions = {
  filler: {
    caseInsensitive: true,
  },
  phrases: {
    caseInsensitive: true,
    phrases: {
      'i think that': '',
      'i believe that': '',
      'it seems that': '',
      'there is a need to': 'we must',
      'it is necessary to': 'we must',
      'in my opinion': '',
      'as you can see': '',
      'as you may know': '',
      'for your information': '',
      'at this juncture': 'now',
      'in this regard': '',
      'on the part of': 'by',
      'is able to': 'can',
      'has the ability to': 'can',
      'utilize': 'use',
      'utilization': 'use',
      'implement': 'use',
      'implementation': 'setup',
      'facilitate': 'help',
      'commence': 'start',
      'endeavor': 'try',
      'pertaining to': 'about',
      'with reference to': 'about',
      'in reference to': 'about',
      'with regard to': 'about',
    },
  },
  whitespace: {
    normalizeLineEndings: true,
    trimTrailing: true,
    collapseNewlines: true,
  },
};
