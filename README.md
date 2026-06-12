# Copy Folder Contents

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=edwinalkins.copy-contents) [![Version](https://img.shields.io/badge/version-0.0.3-green)](https://marketplace.visualstudio.com/items?itemName=edwinalkins.copy-contents) [![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

**Quickly copy the contents of all files in a folder to your clipboard with a single right-click.**

This VS Code extension allows you to copy the combined contents of all files within a selected folder directly to your clipboard. Perfect for developers who need to share code snippets, review file contents, or quickly access multiple files' content without opening each one individually.

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

### Copy All Folder Contents
1. Right-click on any folder in the Explorer
2. Select **"Copy Folder Contents"** from the context menu
3. All file contents are now in your clipboard, ready to paste

### Copy with Selection
1. Right-click on any folder in the Explorer
2. Select **"Copy with Selection"** from the context menu
3. A selection dialog will appear - choose which files to include
4. Selected file contents are copied to your clipboard

### Keyboard Shortcut
You can also add custom keyboard shortcuts for these commands in VS Code settings.

## Configuration

Customize the extension behavior through VS Code settings (`Ctrl+,` or `Cmd+,`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `copyContents.extensions` | `array` | `[".ts", ".js", ".json", ".md", ".py", ".yaml"]` | File extensions to include when copying |
| `copyContents.excludedFolders` | `array` | `[".git", ".vscode", ".DS_Store", ".idea", ".pytest_cache", ".venv", "venv", "node_modules", "__MACOSX", "Thumbs.db"]` | Folders to exclude from copying |
| `copyContents.maxFiles` | `number` | `100` | Maximum number of files to copy |
| `copyContents.maxFileSize` | `number` | `1048576` (1MB) | Maximum file size in bytes to copy |
| `copyContents.copyWithoutHeaders` | `boolean` | `false` | Copy file contents without file name headers |

### Example Configuration

```json
{
  "copyContents.extensions": [".ts", ".js", ".json", ".md"],
  "copyContents.excludedFolders": [".git", "node_modules", "dist"],
  "copyContents.maxFiles": 50,
  "copyContents.maxFileSize": 524288,
  "copyContents.copyWithoutHeaders": true
}
```

## Output Format

By default, files are copied with headers showing the file path:

```
=== file: src/index.ts ===
// file content here

=== file: src/utils/helper.js ===
// file content here
```

When `copyContents.copyWithoutHeaders` is set to `true`, only the raw content is copied without file name headers.

## Requirements

- VS Code 1.105.1 or higher

## Known Limitations

- Binary files are automatically skipped
- Files larger than `maxFileSize` are skipped
- Only the first `maxFiles` files are processed (sorted alphabetically)

## Release Notes

### 0.0.3
- Initial release with core functionality
- Added selective copy feature
- Enhanced configuration options
- Improved file filtering

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests on [GitHub](https://github.com/edwinalkins/copy-contents).

## License

This extension is licensed under the [MIT License](LICENSE).

## Support

If you encounter any issues or have feature requests, please file an issue on the [GitHub repository](https://github.com/edwinalkins/copy-contents).