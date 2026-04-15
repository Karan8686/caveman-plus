# Caveman+ Installation

> Install Caveman+ text compression across all AI coding assistants and IDEs.

## Quick Install

| Tool | Command |
|---|---|
| Claude Code | `claude plugin marketplace add Karan8686/caveman-plus && claude plugin install caveman-plus` |
| Codex | Clone repo → `/plugins` → Search "Caveman+" → Install |
| Gemini CLI | `gemini extensions install https://github.com/Karan8686/caveman-plus` |
| Cursor | `npx skills add Karan8686/caveman-plus -a cursor` |
| Windsurf | `npx skills add Karan8686/caveman-plus -a windsurf` |
| Copilot | `npx skills add Karan8686/caveman-plus -a github-copilot` |
| Cline | `npx skills add Karan8686/caveman-plus -a cline` |
| Any other | `npx skills add Karan8686/caveman-plus` |

## NPM

```bash
npm install caveman-plus
```

## CLI

```bash
npx caveman-plus "text to compress"
npx caveman-plus --mode ultra "verbose text here"
npx caveman-plus --stats "check this out"
```

## Library

```ts
import { compress } from 'caveman-plus';

const result = compress("This is basically just a very long text.", 'full');
```
