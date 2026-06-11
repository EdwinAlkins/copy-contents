# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**copy-contents** is a VS Code extension that copies all files from a selected folder to the system clipboard, filtered by configurable file extensions and excluding specified folders. Users right-click a folder in the Explorer and select "Copy Folder Contents" to use it.

## Key Architecture Points

### Entry Point & Flow
- **`src/extension.ts`**: Main extension entry point containing:
  - `activate()`: Registers the `copy-contents.copy` command
  - `getAllFiles()`: Recursive function that traverses folders, filters by extensions, and respects excluded folders/max files limits
  - `copyTextToClipboard()`: Writes aggregated content to system clipboard via VS Code's API

### Configuration System
- **`src/config.ts`**: Handles extension settings:
  - `extensions` (default: `.ts`, `.js`, `.json`, `.md`, `.py`, `.yaml`)
  - `excludedFolders` (default: `.git`, `.vscode`, `.DS_Store`, etc.)
  - `maxFiles` (default: 100)

### Build System
- Uses **esbuild** for bundling (`esbuild.js`)
- TypeScript compilation via `tsc` with strict mode enabled
- Output goes to `dist/extension.js`

## Common Development Tasks

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Type checking only
npm run check-types

# Build for development (with source maps)
npm run compile

# Watch mode for development
npm run watch

# Build for production (minified, no source maps)
npm run package

# Run tests
npm test

# Pre-test setup (lint + types + build)
npm run pretest
```

## Testing

- **Test framework**: VS Code test runner with Mocha and Sinon for mocking
- **Test files**: Located in `src/test/` (`extension.test.ts`, `config.test.ts`)
- **Run a single test file**: Use the VS Code Test Explorer or modify `.vscode-test.mjs` to target specific tests

## Extension Metadata (from package.json)

- Command: `copy-contents.copy`
- Triggered from: Explorer context menu when right-clicking a folder (`explorerResourceIsFolder`)
- Publisher: `edwinalkins`
- VS Code engine: `^1.105.1`

## Output Structure

```
dist/extension.js       # Bundled extension entry point
out/                    # Compiled test files (from tsc)
```

## Development Notes

- The extension uses **Sinon stubs** extensively in tests to mock VS Code APIs (`vscode.workspace`, `vscode.commands`, `fs`, etc.)
- File aggregation format: Each file is prefixed with a markdown-style header (`--- Fichier: relative/path ---`) for clarity in the clipboard
- Path handling normalizes backslashes to forward slashes for cross-platform consistency
