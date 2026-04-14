export interface TokenEstimation {
  /**
   * Estimated token count before compression
   */
  before: number;
  /**
   * Estimated token count after compression
   */
  after: number;
  /**
   * Tokens saved by compression
   */
  saved: number;
  /**
   * Percentage reduction in token count
   */
  reductionPercent: number;
}

/**
 * Estimates token count using improved heuristics.
 * Uses character-based approximation with adjustments for different text types.
 *
 * Approximation rules:
 * - English text: ~4 characters per token
 * - Code: ~3 characters per token (shorter tokens)
 * - Mixed content: weighted average
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Base heuristic: ~1 token per 4 characters for English text
  // Adjustments based on content characteristics
  const charCount = text.length;
  const wordCount = countWords(text);
  const codeRatio = detectCodeRatio(text);

  // Weighted estimate: character-based + word-based
  const charEstimate = charCount / 4;
  const wordEstimate = wordCount * 1.3; // Average 1.3 tokens per word

  // Blend estimates based on content type
  // Code-heavy text uses more character-based (shorter tokens)
  // Text-heavy content uses word-based (longer tokens)
  const weight = codeRatio;
  const blended = (charEstimate * weight) + (wordEstimate * (1 - weight));

  return Math.ceil(blended);
}

/**
 * Estimates token savings from text compression.
 * Compares token counts before and after compression.
 *
 * @param before - Original text before compression
 * @param after - Compressed text after compression
 * @returns Token estimation with savings metrics
 */
export function estimateTokenSavings(before: string, after: string): TokenEstimation {
  const beforeTokens = estimateTokens(before);
  const afterTokens = estimateTokens(after);
  const saved = beforeTokens - afterTokens;
  const reductionPercent = beforeTokens > 0 ? Math.round((saved / beforeTokens) * 100) : 0;

  return {
    before: beforeTokens,
    after: afterTokens,
    saved,
    reductionPercent,
  };
}

/**
 * Alias for estimateTokenSavings - returns compression statistics.
 *
 * @param original - Original text before compression
 * @param compressed - Compressed text after compression
 * @returns Token estimation with savings metrics
 */
export function getCompressionStats(original: string, compressed: string): TokenEstimation {
  return estimateTokenSavings(original, compressed);
}

/**
 * Counts words in text using word boundary detection.
 */
function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  const matches = text.trim().match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

/**
 * Detects the ratio of code-like content in text.
 * Returns 0.0 (no code) to 1.0 (all code).
 */
function detectCodeRatio(text: string): number {
  if (!text) return 0;

  // Check for code block markers
  const codeBlockMatches = text.match(/```[\s\S]*?```/g);
  if (!codeBlockMatches) return 0;

  let codeLength = 0;
  for (const block of codeBlockMatches) {
    codeLength += block.length;
  }

  return codeLength / text.length;
}
