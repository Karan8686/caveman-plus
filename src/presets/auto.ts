import { CompressOptions, CompressMode } from '../core/pipeline.js';
import { detectContext, ContextType } from '../utils/context.js';

/**
 * Configuration for auto mode thresholds
 */
export interface AutoModeConfig {
  /**
   * Character count thresholds for mode selection
   * - below shortThreshold: lite
   * - between shortThreshold and longThreshold: depends on context
   * - above longThreshold: ultra (unless context overrides)
   */
  shortThreshold?: number;
  longThreshold?: number;
}

/**
 * Default auto mode configuration
 */
const DEFAULT_AUTO_CONFIG: Required<AutoModeConfig> = {
  shortThreshold: 100,  // Below 100 chars -> lite
  longThreshold: 500,   // Above 500 chars -> ultra (unless context overrides)
};

/**
 * Determines the optimal compression mode based on text characteristics.
 *
 * Selection logic:
 * - **Short text** (< 100 chars): lite (preserve what little content exists)
 * - **Error/Code context**: lite (preserve technical details regardless of length)
 * - **Explanation context**: full (standard compression for explanatory text)
 * - **Normal context, medium length** (100-500 chars): full (balanced compression)
 * - **Normal context, long text** (> 500 chars): ultra (aggressive compression needed)
 *
 * @param text - The text to analyze
 * @param config - Optional threshold configuration
 * @returns The recommended CompressMode
 */
export function selectAutoMode(
  text: string,
  config?: AutoModeConfig
): CompressMode {
  const thresholds = { ...DEFAULT_AUTO_CONFIG, ...config };
  const length = text.length;

  // Short text: always lite to preserve content
  if (length < thresholds.shortThreshold) {
    return 'lite';
  }

  // Detect context for longer text
  const context = detectContext(text);

  // Error/code: preserve technical details
  if (context === 'error' || context === 'code') {
    return 'lite';
  }

  // Explanation: standard compression
  if (context === 'explanation') {
    return 'full';
  }

  // Normal text: length-based selection
  if (length < thresholds.longThreshold) {
    return 'full';
  }

  // Long normal text: aggressive compression
  return 'ultra';
}

/**
 * Auto preset - dynamically selects compression mode based on input.
 * This is a meta-preset that delegates to lite/full/ultra based on analysis.
 *
 * @param text - The text to analyze (optional, returns undefined if not provided)
 * @returns The selected mode or undefined if text is empty
 */
export function getAutoMode(text?: string): CompressMode | undefined {
  if (!text || !text.trim()) {
    return undefined;
  }
  return selectAutoMode(text);
}

/**
 * Exports the auto preset options for use in the pipeline.
 * Auto mode doesn't have its own options - it delegates to other presets.
 */
export const auto: CompressOptions = {};
