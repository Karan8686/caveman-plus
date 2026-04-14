import { splitCodeBlocks, Segment } from '../utils/splitCode.js';

/**
 * Default phrase replacements for compression
 * Keys are verbose phrases, values are their shorter equivalents
 */
export const DEFAULT_PHRASES: Record<string, string> = {
  'the reason is because': 'because',
  'the reason being that': 'because',
  'due to the fact that': 'because',
  'owing to the fact that': 'because',
  'in order to': 'to',
  'so as to': 'to',
  'it is important to note that': '',
  'it is worth noting that': '',
  'it should be noted that': '',
  'it is worth mentioning that': '',
  'needless to say': '',
  'it goes without saying': '',
  'at this point in time': 'now',
  'at the present time': 'now',
  'at the end of the day': 'ultimately',
  'in the near future': 'soon',
  'for the purpose of': 'for',
  'with the exception of': 'except',
  'in the event that': 'if',
  'in case of': 'if',
  'as a matter of fact': 'actually',
  'for all intents and purposes': '',
  'in my honest opinion': '',
  'to be honest': '',
  'to tell you the truth': '',
  'as far as i am concerned': '',
  'what i mean is': '',
  'what i am trying to say is': '',
  'let me make it clear': '',
  'i would like to point out': '',
  'it is generally believed that': '',
  'there is no doubt that': '',
  'without a shadow of a doubt': '',
  'in conclusion': '',
  'to sum up': '',
  'all in all': '',
  'on the other hand': 'however',
  'in spite of': 'despite',
  'regardless of the fact that': 'although',
  'in spite of the fact that': 'although',
  'due to': 'from',
  'prior to': 'before',
  'subsequent to': 'after',
  'with regard to': 'about',
  'with respect to': 'about',
  'in relation to': 'about',
  'concerning the matter of': 'about',
  'as soon as possible': 'quickly',
  'at your earliest convenience': 'soon',
  'on a daily basis': 'daily',
  'on a regular basis': 'regularly',
  'in a timely manner': 'promptly',
  'for the most part': 'mostly',
  'to a certain extent': 'somewhat',
  'by virtue of': 'by',
  'by means of': 'by',
  'in accordance with': 'per',
  'in conjunction with': 'with',
  'in addition to': 'besides',
  'in light of': 'given',
  'in view of': 'given',
  'as a result of': 'from',
  'because of the fact that': 'because',
  'since': 'because',
  'therefore': 'so',
  'furthermore': 'also',
  'moreover': 'also',
  'nevertheless': 'but',
  'nonetheless': 'but',
  'notwithstanding': 'despite',
};

export interface PhraseOptions {
  /**
   * Additional phrase replacements to apply
   */
  phrases?: Record<string, string>;
  /**
   * Case-insensitive matching (default: true)
   */
  caseInsensitive?: boolean;
}

/**
 * Compresses verbose phrases into shorter, clearer equivalents.
 * Preserves code blocks and maintains readability.
 *
 * @param text - The text to compress
 * @param options - Optional configuration for phrase compression
 * @returns Text with verbose phrases replaced by shorter equivalents
 */
export function compressPhrases(text: string, options?: PhraseOptions): string {
  if (!text) return '';

  const customPhrases = options?.phrases ?? {};
  const caseInsensitive = options?.caseInsensitive ?? true;

  // Merge default and custom phrases
  const phrases = { ...DEFAULT_PHRASES, ...customPhrases };

  // Split text into code and text segments
  const segments = splitCodeBlocks(text);

  // Process each segment
  const processed = segments.map((segment: Segment) => {
    if (segment.type === 'code') {
      // Preserve code blocks exactly as they are
      return segment.content;
    }

    // Compress phrases in text segments
    return compressPhrasesInText(segment.content, phrases, caseInsensitive);
  });

  return processed.join('');
}

/**
 * Compresses verbose phrases in a text segment using regex.
 * Sorts phrases by length (longest first) to avoid partial matches.
 * Preserves leading/trailing whitespace for proper segment boundaries.
 */
function compressPhrasesInText(
  text: string,
  phrases: Record<string, string>,
  caseInsensitive: boolean
): string {
  // Extract and preserve leading/trailing whitespace
  const leadingWs = text.match(/^\s*/)?.[0] || '';
  const trailingWs = text.match(/\s*$/)?.[0] || '';

  // Work with inner content
  let inner = text.slice(leadingWs.length, text.length - trailingWs.length);

  // Sort phrases by length (longest first) to match longer phrases before shorter ones
  const sortedPhrases = Object.entries(phrases).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [phrase, replacement] of sortedPhrases) {
    // Escape special regex characters
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseInsensitive ? 'gi' : 'g';
    const regex = new RegExp(`\\b${escaped}\\b`, flags);

    // Replace phrase and clean up spacing
    inner = inner
      .replace(regex, replacement)
      .replace(/  +/g, ' ')
      .replace(/ +([.,;!?])/g, '$1');
  }

  // Reconstruct with preserved boundaries
  return leadingWs + inner.trim() + trailingWs;
}
