#!/usr/bin/env node

import { compress, CompressMode, getCompressionStats } from '../index.js';
import { loadConfig, mergeConfig } from '../utils/config.js';
import { readFileSync } from 'node:fs';

interface CliArgs {
  input: string;
  mode: CompressMode | undefined;
  help: boolean;
  version: boolean;
  noConfig: boolean;
  stats: boolean;
  preserveErrors: boolean;
  preserveLogs: boolean;
  file?: string;
}

const VERSION = '1.0.0';

function parseArgs(args: string[]): CliArgs {
  let mode: CompressMode | undefined;
  let help = false;
  let version = false;
  let noConfig = false;
  let stats = false;
  let preserveErrors = false;
  let preserveLogs = false;
  let file: string | undefined;
  let inputParts: string[] = [];

  const validModes: CompressMode[] = ['lite', 'full', 'ultra', 'context', 'auto'];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;

      case '--version':
      case '-v':
        version = true;
        break;

      case '--no-config':
        noConfig = true;
        break;

      case '--stats':
      case '-s':
        stats = true;
        break;

      case '--preserve-errors':
        preserveErrors = true;
        break;

      case '--preserve-logs':
        preserveLogs = true;
        break;

      case '--mode':
      case '-m':
        i++;
        const modeValue = args[i];
        if (!modeValue || !validModes.includes(modeValue as CompressMode)) {
          console.error(`Error: Invalid mode "${modeValue}". Must be one of: ${validModes.join(', ')}`);
          process.exit(1);
        }
        mode = modeValue as CompressMode;
        break;

      case '--file':
      case '-f':
        i++;
        file = args[i];
        break;

      default:
        if (arg.startsWith('--') || arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        inputParts.push(arg);
        break;
    }
    i++;
  }

  return {
    input: inputParts.join(' '),
    mode,
    help,
    version,
    noConfig,
    stats,
    preserveErrors,
    preserveLogs,
    file,
  };
}

function showHelp(): void {
  console.log(`
Usage: caveman [options] <text>

Compress verbose text by removing filler words, shortening phrases, and normalizing whitespace.

Options:
  -m, --mode <mode>     Compression mode: lite, full, ultra, context, auto (default: full)
  -s, --stats           Show token compression statistics (savings, percentage)
  --preserve-errors     Apply minimal compression to error messages and stack traces
  --preserve-logs       Apply lighter compression to log messages with timestamps/levels
  -f, --file <path>     Read input from file instead of command line
  --no-config           Skip loading caveman.config.json or .cavemanrc
  -h, --help            Show this help message
  -v, --version         Show version number

Config:
  Place a caveman.config.json or .cavemanrc in your project directory to set defaults.
  CLI flags override config file values.

Examples:
  caveman "This is basically just a test"
  caveman --mode ultra "It is important to note that..."
  caveman --file input.md --mode ultra
  caveman --stats "This is actually just a very long text."
  cat input.md | caveman --mode full
`);
}

function showStats(original: string, compressed: string): void {
  const stats = getCompressionStats(original, compressed);
  console.error(`\n--- Compression Statistics ---`);
  console.error(`Tokens before:  ${stats.before}`);
  console.error(`Tokens after:   ${stats.after}`);
  console.error(`Tokens saved:   ${stats.saved}`);
  console.error(`Reduction:      ${stats.reductionPercent}%`);
  console.error(`------------------------------\n`);
}

async function readInput(file: string | undefined, stdinText: string): Promise<string> {
  if (file) {
    try {
      return readFileSync(file, 'utf-8');
    } catch (err) {
      console.error(`Error reading file: ${file}`);
      process.exit(1);
    }
  }

  // Try stdin if no command line text provided
  if (stdinText && !process.stdin.isTTY) {
    return stdinText;
  }

  return '';
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  // Read stdin if available
  let stdinText = '';
  if (!process.stdin.isTTY) {
    stdinText = await new Promise<string>((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (chunk) => (data += chunk));
      process.stdin.on('end', () => resolve(data));
    });
  }

  const input = await readInput(args.file, stdinText);

  // Use command line text, or fall back to stdin
  const text = args.input || input;

  if (!text) {
    console.error('Error: No input provided.');
    console.error('Usage: caveman [options] <text>');
    console.error('Try "caveman --help" for more information.');
    process.exit(1);
  }

  // Load config unless explicitly disabled
  const config = args.noConfig ? {} : loadConfig();
  const options = mergeConfig(config, {
    mode: args.mode,
    preserveErrors: args.preserveErrors || undefined,
    preserveLogs: args.preserveLogs || undefined,
  });

  const result = compress(text, options);
  console.log(result);

  // Show stats if requested
  if (args.stats) {
    showStats(text, result);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
