import { CompressMode, CompressOptions } from '../core/pipeline.js';
import { FillerOptions, DEFAULT_FILLERS } from '../rules/filler.js';
import { PhraseOptions, DEFAULT_PHRASES } from '../rules/phrases.js';
import { WhitespaceOptions } from '../rules/whitespace.js';
import { lite } from '../presets/lite.js';
import { full } from '../presets/full.js';
import { ultra } from '../presets/ultra.js';
import {
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

// Helpers for safe Node API calls
const nodeExistsSync = (p: string) => existsSync(p);
const nodeReadFileSync = (p: string, enc: any) => readFileSync(p, enc);
const nodeStatSync = (p: string) => statSync(p);
const nodeDirname = (p: string) => dirname(p);
const nodeResolve = (...args: string[]) => resolve(...args);
const nodeHomedir = () => homedir();
const nodeCwd = () => process.cwd();

/**
 * Configuration options loaded from caveman.config.json
 */
export interface CavemanConfig {
  /**
   * Compression mode: lite, full, ultra, context, auto
   */
  mode?: CompressMode;
  /**
   * Filler word removal options
   */
  filler?: FillerOptions | false;
  /**
   * Phrase compression options
   */
  phrases?: PhraseOptions | false;
  /**
   * Whitespace normalization options
   */
  whitespace?: WhitespaceOptions | false;
  /**
   * Additional custom filler words to remove
   */
  customFillers?: string[];
  /**
   * Additional phrase replacements
   */
  customPhrases?: Record<string, string>;
  /**
   * Custom instructions for AI prompt generation
   */
  promptInstructions?: string[];
  /**
   * Domain context for prompt generation
   */
  domain?: string;
  /**
   * When true, detect error messages and apply minimal compression
   */
  preserveErrors?: boolean;
  /**
   * When true, detect log messages and apply lighter compression
   */
  preserveLogs?: boolean;
}

/**
 * Config search result
 */
interface ConfigResult {
  config: CavemanConfig | null;
  configPath: string | null;
}

const CONFIG_FILENAMES = ['caveman.config.json', '.cavemanrc'];

/**
 * Searches for config files starting from the given directory,
 * walking up parent directories until found or root is reached.
 * Supports both 'caveman.config.json' and '.cavemanrc'.
 */
export function findConfig(startDir: string = nodeCwd()): ConfigResult {
  let current = startDir;

  while (true) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = nodeResolve(current, filename);

      if (nodeExistsSync(configPath)) {
        const stat = nodeStatSync(configPath);
        if (stat?.isFile?.()) {
          return { config: null, configPath };
        }
      }
    }

    const parent = nodeDirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return { config: null, configPath: null };
}

/**
 * Loads config from a specific file path.
 */
export function loadConfigFile(path: string): CavemanConfig {
  try {
    const raw = nodeReadFileSync(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Loads config from the nearest config file.
 * Checks cwd → parent directories → home directory.
 * Supports both 'caveman.config.json' and '.cavemanrc'.
 */
export function loadConfig(startDir: string = nodeCwd()): CavemanConfig {
  const { configPath } = findConfig(startDir);

  if (configPath) {
    return loadConfigFile(configPath);
  }

  // Fall back to home directory config files
  const homeDir = nodeHomedir();
  if (homeDir) {
    for (const filename of CONFIG_FILENAMES) {
      const homeConfig = nodeResolve(homeDir, filename);
      if (nodeExistsSync(homeConfig)) {
        return loadConfigFile(homeConfig);
      }
    }
  }

  return {};
}

/**
 * Loads the mode preset defaults.
 */
function loadModePreset(mode: CompressMode): CompressOptions {
  const presets: Record<CompressMode, CompressOptions> = { lite, full, ultra, context: full, auto: full };
  return presets[mode] ?? full;
}

/**
 * Merges config options with explicit overrides.
 * Priority: overrides > config values > mode preset defaults
 */
export function mergeConfig(
  config: CavemanConfig,
  overrides: CompressOptions
): CompressOptions {
  // Resolve the mode
  const mode = overrides.mode ?? config.mode ?? 'full';

  // Get mode preset defaults
  const preset = loadModePreset(mode);

  // Merge filler options: preset defaults + config custom fillers + overrides
  const filler = overrides.filler !== undefined
    ? overrides.filler
    : mergeFillerOptions(preset.filler, config);

  // Merge phrase options: preset defaults + config custom phrases + overrides
  const phrases = overrides.phrases !== undefined
    ? overrides.phrases
    : mergePhraseOptions(preset.phrases, config);

  // Merge whitespace: overrides > config > preset
  const whitespace = overrides.whitespace ?? config.whitespace ?? preset.whitespace;

  // Merge preservation flags: overrides > config > defaults
  const preserveErrors = overrides.preserveErrors ?? config.preserveErrors ?? false;
  const preserveLogs = overrides.preserveLogs ?? config.preserveLogs ?? false;

  return {
    mode,
    filler,
    phrases,
    whitespace,
    preserveErrors,
    preserveLogs,
  };
}

/**
 * Merges preset filler options with config custom fillers.
 * Uses DEFAULT_FILLERS as base only when preset doesn't specify its own list.
 */
function mergeFillerOptions(
  preset: FillerOptions | false | undefined,
  config: CavemanConfig
): FillerOptions | false {
  if (preset === false) return false;
  if (config.filler === false) return false;

  // Determine base fillers: use preset's list if specified, otherwise defaults
  let fillers: string[] | undefined;
  if (preset && typeof preset === 'object' && preset.fillers) {
    // Preset specifies its own list (e.g., lite mode)
    fillers = [...preset.fillers];
  } else {
    // Use all default fillers (e.g., full, ultra modes)
    fillers = [...DEFAULT_FILLERS];
  }

  // Build base options
  const base: FillerOptions = { fillers };
  if (preset && typeof preset === 'object' && preset.caseInsensitive !== undefined) {
    base.caseInsensitive = preset.caseInsensitive;
  }

  // Apply config filler overrides
  if (config.filler && typeof config.filler === 'object') {
    if (config.filler.caseInsensitive !== undefined) {
      base.caseInsensitive = config.filler.caseInsensitive;
    }
    if (config.filler.fillers) {
      // Config explicitly overrides the fillers list entirely
      fillers = [...config.filler.fillers];
      base.fillers = fillers;
    }
  }

  // Append custom fillers to the current set
  if (config.customFillers?.length) {
    base.fillers = [...(base.fillers ?? fillers), ...config.customFillers];
  }

  return base;
}

/**
 * Merges preset phrase options with config custom phrases.
 * Uses DEFAULT_PHRASES as the base, then applies preset overrides, then adds custom phrases.
 */
function mergePhraseOptions(
  preset: PhraseOptions | false | undefined,
  config: CavemanConfig
): PhraseOptions | false {
  if (preset === false) return false;
  if (config.phrases === false) return false;

  // Start with default phrases
  const base: PhraseOptions = { phrases: { ...DEFAULT_PHRASES } };

  // Apply preset overrides (caseInsensitive, custom phrases, etc.)
  if (preset && typeof preset === 'object') {
    if (preset.caseInsensitive !== undefined) base.caseInsensitive = preset.caseInsensitive;
    if (preset.phrases) base.phrases = { ...base.phrases!, ...preset.phrases };
  }

  // Apply config phrase overrides
  if (config.phrases && typeof config.phrases === 'object') {
    if (config.phrases.caseInsensitive !== undefined) {
      base.caseInsensitive = config.phrases.caseInsensitive;
    }
    if (config.phrases.phrases) {
      base.phrases = { ...base.phrases!, ...config.phrases.phrases };
    }
  }

  // Merge custom phrases with current set
  if (config.customPhrases && Object.keys(config.customPhrases).length > 0) {
    base.phrases = { ...(base.phrases ?? {}), ...config.customPhrases };
  }

  return base;
}
