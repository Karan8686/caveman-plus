export { compress, type CompressOptions, type CompressMode } from './core/pipeline.js';

export { splitCodeBlocks, type Segment, type CodeSegment, type TextSegment } from './utils/splitCode.js';

export {
    removeFiller,
    type FillerOptions,
    DEFAULT_FILLERS,
} from './rules/filler.js';

export {
    compressPhrases,
    type PhraseOptions,
    DEFAULT_PHRASES,
} from './rules/phrases.js';

export {
    normalizeWhitespace,
    type WhitespaceOptions,
} from './rules/whitespace.js';

export {
    compressMarkdown,
    parseMarkdown,
    recompressMarkdown,
    type MarkdownSegment,
} from './rules/markdown.js';

export { lite } from './presets/lite.js';
export { full } from './presets/full.js';
export { ultra } from './presets/ultra.js';
export { auto, getAutoMode, selectAutoMode, type AutoModeConfig } from './presets/auto.js';

export { getPrompt, type PromptOptions } from './adapters/prompt.js';

export {
    loadConfig,
    loadConfigFile,
    findConfig,
    mergeConfig,
    type CavemanConfig,
} from './utils/config.js';

export {
    estimateTokens,
    estimateTokenSavings,
    getCompressionStats,
    type TokenEstimation,
} from './utils/tokenEstimator.js';

export {
    detectContext,
    type ContextType,
} from './utils/context.js';

export {
    compressStream,
    finalizeStream,
    type StreamState,
} from './core/stream.js';
