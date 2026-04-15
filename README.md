# Caveman+

> 🪨 **[Try the Live Playground →](https://Karan8686.github.io/caveman-plus/)** — paste any AI text, see compression in real-time. No code needed.

**Reduce AI output tokens by 40-70% while preserving all technical meaning.**

Caveman+ is an intelligent text compression library that removes filler words, shortens verbose phrases, and normalizes whitespace. Built for AI workflows, developer tools, and any scenario where concise text matters.

```
"This is basically just a really verbose sentence that could definitely be compressed quite a bit."
→ "This is a verbose sentence that could be compressed a bit."
```

## Why Caveman+?

AI models tend to be unnecessarily verbose. Caveman+ fixes that:

- **Preserves code blocks** - Technical content stays intact
- **Context-aware** - Errors, logs, and explanations get appropriate compression
- **Deterministic** - Same input always produces same output
- **Zero dependencies** - Pure TypeScript, no external APIs
- **Streaming-ready** - Process AI responses chunk-by-chunk

Works seamlessly with **Qwen Code**, **Claude**, **ChatGPT**, and any AI tool that produces verbose output.

## Compatibility

Caveman Plus is designed to be universal and isomorphic:
- **Node.js**: Supports Node 18+ (both ESM and CommonJS).
- **Browsers**: Native support for modern browsers and bundlers (Vite, Webpack, etc.).
- **CLI**: Fully functional command-line interface.
- **TypeScript**: First-class type definitions included.

## Installation

```bash
npm install caveman-plus
```

Or use globally as a CLI tool:

```bash
npm install -g caveman-plus
```

## Quick Start

### CLI

```bash
caveman "This is basically just a test that really works very well."
# Output: This is a test that works well.
```

### API

```ts
import { compress } from 'caveman-plus';

const result = compress('This is basically just a test.');
// "This is a test."
```

## Compression Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `lite` | Removes only obvious fillers (`just`, `very`, `really`) | Minimal changes, conservative |
| `full` | Default. Removes all fillers, compresses phrases | General purpose |
| `ultra` | Maximum compression, aggressive replacements | Shortest possible output |
| `context` | Auto-detects content type, applies appropriate level | Mixed content documents |
| `auto` | Dynamically selects mode based on length + context | Set-and-forget |

### CLI Usage

```bash
# Default (full mode)
caveman "It is important to note that this basically just works."

# Lite mode
caveman --mode lite "This is basically just a test."
# Output: This is basically a test.

# Ultra mode
caveman --mode ultra "In order to conclude, it is important to note that..."
# Output: to conclude, ...

# Context-aware (different compression for errors vs normal text)
caveman --mode context "Error: Something just failed. This is actually a normal sentence."

# Auto mode (selects based on length and context)
caveman --mode auto "Short text."

# Show compression statistics
caveman --stats "This is actually just a very long and verbose text."
# Output: This is a long and verbose text.
#
# --- Compression Statistics ---
# Tokens before:  12
# Tokens after:   9
# Tokens saved:   3
# Reduction:      25%

# Preserve error messages (minimal compression for errors/stack traces)
caveman --preserve-errors "TypeError: Cannot read property 'foo' at Object.<anonymous>"

# Preserve log messages (lighter compression for logs with timestamps)
caveman --preserve-logs "2024-01-15 12:30:45 INFO: This is basically just a log message"

# Read from file
caveman --file input.md --mode ultra

# Read from stdin
cat input.md | caveman --mode full

# Skip config file
caveman --no-config "Text here"

# Help
caveman --help
```

### API Usage

```ts
import { compress, estimateTokenSavings, getPrompt } from 'caveman-plus';

// Compress with mode string
const result = compress(text, 'ultra');

// Compress with custom options
const result = compress(text, {
  mode: 'full',
  filler: { fillers: ['just', 'basically'] },
});

// Context-aware compression (different levels for errors vs normal text)
const result = compress(text, 'context');

// Auto mode (dynamically selects based on content)
const result = compress(text, 'auto');

// Selective preservation flags
const result = compress(text, {
  mode: 'ultra',
  preserveErrors: true, // Keep error messages intact
  preserveLogs: true,   // Lighter compression for log messages
});

// Disable specific steps
const result = compress(text, {
  mode: 'full',
  phrases: false,  // skip phrase compression
});

// Estimate token savings
const before = 'This is basically just a very long text.';
const after = compress(before, 'full');
const savings = estimateTokenSavings(before, after);
console.log(`${savings.reductionPercent}% reduction (${savings.saved} tokens saved)`);

// Generate AI system prompt (for Qwen, Claude, ChatGPT, etc.)
const prompt = getPrompt({
  mode: 'full',
  domain: 'technical',
  customInstructions: ['- Always respond in markdown'],
});
```

## Code Block Preservation

Code blocks are **never modified**:

```ts
const input = `Intro text that is basically verbose.

\`\`\`javascript
const reallyImportant = "don't change me";
function actuallyWorks() {
  return true;
}
\`\`\`

In order to conclude, this is it.`;

compress(input, 'full');
// Code block preserved exactly, surrounding text compressed
```

## Markdown Preservation

Caveman+ understands markdown structure and preserves it:

- **Headings** (`#`, `##`, `###`) - markers preserved, text compressed
- **Lists** (`-`, `*`, `1.`) - bullets/numbers preserved, items compressed
- **Blockquotes** (`>`) - quote markers preserved, quote text compressed
- **Tables** (`| col |`) - pipe structure preserved, cells compressed
- **Thematic breaks** (`---`, `***`) - kept exactly as-is

## Streaming Support

Process AI responses chunk-by-chunk:

```ts
import { compressStream, finalizeStream } from 'caveman-plus';

let state;
for await (const chunk of streamingAIResponse) {
  const { output, state: newState } = compressStream(chunk, state, 'full');
  state = newState;
  if (output) process.stdout.write(output);
}
// Flush remaining buffered text
const final = finalizeStream(state, 'full');
if (final) process.stdout.write(final);
```

## Configuration

Place `caveman.config.json` in your project directory:

```json
{
  "mode": "ultra",
  "customFillers": ["obviously", "clearly"],
  "customPhrases": {
    "at the end of the day": "ultimately",
    "is able to": "can"
  },
  "preserveErrors": true,
  "preserveLogs": true
}
```

Config is loaded automatically from the current directory, parent directories, or home directory. CLI flags override config values.

## Integration Examples

### Qwen Code Integration

```ts
import { getPrompt, compress } from 'caveman-plus';

// Generate compression system prompt
const systemPrompt = getPrompt({
  mode: 'context',
  domain: 'technical',
  customInstructions: ['- Preserve code examples exactly as written'],
});

// Post-process Qwen's response
const compressed = compress(aiResponse, {
  mode: 'context',
  preserveErrors: true,
  preserveLogs: true,
});
```

### Node.js API Post-Processing

```ts
import { compress } from 'caveman-plus';

// Express middleware to compress AI responses
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body.response) {
      body.response = compress(body.response, 'full');
    }
    return originalJson(body);
  };
  next();
});
```

## Sample Outputs

| Input | Mode | Output | Reduction |
|-------|------|--------|-----------|
| `This is basically just a test.` | lite | `This is a test.` | ~30% |
| `The reason is because in order to fix this...` | full | `because to fix this...` | ~45% |
| `It is important to note that we need to utilize...` | ultra | `we need to use...` | ~60% |

## All Exports

```ts
import {
  // Core
  compress,              // Full compression pipeline
  CompressMode,          // Type: 'lite' | 'full' | 'ultra' | 'context' | 'auto'
  CompressOptions,       // Configuration interface
  
  // Rules (individual steps)
  splitCodeBlocks,       // Split markdown into segments
  removeFiller,          // Remove filler words only
  compressPhrases,       // Replace verbose phrases only
  normalizeWhitespace,   // Clean up spacing only
  compressMarkdown,      // Markdown-aware compression
  
  // Token estimation
  estimateTokens,        // Estimate token count
  estimateTokenSavings,  // Compare before/after tokens
  getCompressionStats,   // Get compression statistics
  
  // Context detection
  detectContext,         // Classify text as error/code/explanation/normal
  
  // Auto mode
  selectAutoMode,        // Dynamically select compression mode
  getAutoMode,           // Get recommended mode for text
  
  // Streaming
  compressStream,        // Process streaming text
  finalizeStream,        // Flush remaining buffer
  
  // AI integration
  getPrompt,             // Generate AI system prompts
  
  // Config
  loadConfig,            // Load config file
  mergeConfig,           // Merge config with overrides
  
  // Presets
  lite, full, ultra, auto,  // Mode preset objects
  DEFAULT_FILLERS,       // Default filler word list
  DEFAULT_PHRASES,       // Default phrase replacements
} from 'caveman-plus';
```

## Examples

See the `examples/` directory for complete integration examples:

- [`examples/qwen/`](examples/qwen/index.ts) - Qwen Code integration with system prompts
- [`examples/node/`](examples/node/index.ts) - Node.js API post-processing
- [`examples/stream/`](examples/stream/index.ts) - Streaming AI response compression

## License

ISC
