# Copy Contents

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=edwinalkins.copy-contents) [![Version](https://img.shields.io/badge/version-0.0.6-green)](https://marketplace.visualstudio.com/items?itemName=edwinalkins.copy-contents) [![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

**Copy the entire contents of a folder to your clipboard in one click – ideal for feeding LLMs when you have plenty of tokens available.**

This VS Code extension allows you to copy the combined contents of all files within a selected folder directly to your clipboard. Perfect for developers who need to share code snippets, to review file contents, or to quickly access multiple files' content without opening each one individually. It becomes easy to share code with language models (ChatGPT, Claude, Copilot, etc.). No more opening files one by one – you instantly provide the context needed for analysis, refactoring, or code generation by the AI.

## Features

- **Copy Folder Contents** - Copy all file contents from a folder with one click
- **Selective Copy** - Choose which files to include with selection support
- **Customizable** - Configure file extensions, excluded folders, and size limits
- **Lightning Fast** - Process files efficiently without blocking your editor
- **Smart Filtering** - Automatically excludes common folders like `.git`, `node_modules`, etc.

## Installation

1. Open **Extensions** sidebar in VS Code (`Ctrl+Shift+X` or `Cmd+Shift+X`)
2. Search for **"Copy Folder Contents"**
3. Click **Install**

Or install via command line:
```bash
code --install-extension edwinalkins.copy-contents
```

## Usage

### Copy Folder Contents
1. In the Explorer, select one or more files and/or folders (use `Ctrl`/`Cmd` or `Shift` for multi-selection)
2. Right-click and choose **"Copy Folder Contents"** from the context menu
3. Selected folders are traversed recursively (filtered by extension); explicitly selected files are always included regardless of the filter
4. All file contents are now in your clipboard, ready to paste into an LLM chat

### Copy with Selection
1. In the Explorer, select one or more files and/or folders, then right-click
2. Select **"Copy with Selection"** from the context menu
3. A selection dialog appears — pick which files to include. Each folder shows up as a header you can toggle to check/uncheck all of its files at once
4. Selected file contents are copied to your clipboard

### Keyboard Shortcut
You can also add custom keyboard shortcuts for these commands in VS Code settings.

## Configuration

Customize the extension behavior through VS Code settings (`Ctrl+,` or `Cmd+,`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `copyContents.extensions` | `array` | `[".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".py", ".yaml", ".rs", ".toml", ".go", ".php", ".yml"]` | File extensions to include when copying. An empty list copies every file. |
| `copyContents.excludedFolders` | `array` | `[".git", ".vscode", ".DS_Store", ".idea", ".pytest_cache", ".venv", "venv", "node_modules", "__MACOSX", "Thumbs.db", "dist", "build", "target", "__pycache__"]` | Folders to exclude from copying |
| `copyContents.maxFiles` | `number` | `100` | Maximum number of files to copy |
| `copyContents.maxFileSize` | `number` | `1048576` (1MB) | Maximum file size in bytes to copy |
| `copyContents.copyWithoutHeaders` | `boolean` | `false` | Copy file contents without file name headers |
| `copyContents.headerFormat` | `string` | `"--- File: {path} ---"` | Template for the header placed before each file. Use `{path}` as a placeholder for the file path (e.g. `"# {path}"` or `"=== {path} ==="`). If `{path}` is missing, the default format is used. |

### Example Configuration

```json
{
  "copyContents.extensions": [".ts", ".js", ".json", ".md"],
  "copyContents.excludedFolders": [".git", "node_modules", "dist"],
  "copyContents.maxFiles": 50,
  "copyContents.maxFileSize": 524288,
  "copyContents.copyWithoutHeaders": false,
  "copyContents.headerFormat": "# {path}"
}
```

## Output Format

By default, files are copied with headers showing the file path:

```
--- File: src/index.ts ---
// file content here

--- File: src/utils/helper.js ---
// file content here
```

You can customize the header via `copyContents.headerFormat` (use `{path}` as the file-path placeholder), or set `copyContents.copyWithoutHeaders` to `true` to copy only the raw content without any headers.

## Perfect for LLMs (when you have enough tokens)

- Full context at once – Hand an entire module or project to the LLM in a single message, enabling deep analysis.
- Token control – File selection, size limits, and extension filtering help you stay within any token ceiling.
- Huge time saver – No more tedious copy‑pasting; you get a ready‑to‑use prompt in seconds.
- Clear structure – Headers make it easy for the LLM to understand the project layout.

Whether you need AI‑powered refactoring, debugging, documentation generation, or youjust want to ask a question about a codebase, Copy Folder Contents prepares the perfect context.

## Requirements

- VS Code 1.105.1 or higher

## Known Limitations

- Binary files are automatically skipped
- Files larger than `maxFileSize` are skipped
- Only the first `maxFiles` files are processed (sorted alphabetically)

## Release Notes

### 0.0.6
- Faster folder traversal (`withFileTypes`, no per-file `stat`; extensions matched via a prebuilt set)
- Lower memory usage on large selections: files are read sequentially instead of all at once
- Skipped/unreadable files are now reported as a single aggregated warning instead of one popup per file
- `headerFormat` is validated once instead of per file (no more console spam on a bad format)
- Removed a duplicate `.pytest_cache` default, added `moduleResolution: "Node16"` to `tsconfig.json`
- Docs: updated default extensions, documented `copyContents.headerFormat`, fixed the output-format example

### 0.0.5
- Explore multi-selection support: both commands operate on the entire selection (files and/or folders); selected folders are traversed recursively while explicitly selected files are always included
- One-click folder toggle in "Copy with Selection": each directory header checks/unchecks all of its files at once
- Improved visual hierarchy in the selection picker: directory separators, folder/file icons and tree-style indentation
- Context menu entries now appear on files as well as folders

### 0.0.4
- Initial public release with core functionality, selective copy, configurable extensions, excluded folders and size limits

---

## Contributing

Contributions and feedbacks are welcome! Please feel free to submit issues or pull requests on [GitHub](https://github.com/edwinalkins/copy-contents).

## License

This extension is licensed under the [MIT License](LICENSE).

## Support

If you encounter any issues or have feature requests, please file an issue on the [GitHub repository](https://github.com/edwinalkins/copy-contents).