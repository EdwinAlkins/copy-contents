# Change Log

All notable changes to the "copy-contents" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.7] - 2026-06-28

### Added

- **Keyboard shortcut**: `Ctrl+Alt+C` (Windows/Linux) / `Cmd+Alt+C` (macOS) runs **Copy Folder Contents** on the current Explorer selection. The binding is scoped to `filesExplorerFocus && !inputFocus`, so it never clashes with editor shortcuts and stays inactive while renaming. It can be rebound from VS Code's Keyboard Shortcuts editor.

### Changed

- Both commands now resolve the Explorer selection from the live selection when invoked without arguments (e.g. via the keyboard shortcut), falling back to the built-in `copyFilePath` command and restoring the clipboard afterwards.

### Documentation

- Documented the new keyboard shortcut in the README and replaced the inline "Release Notes" section with a link to this changelog.

## [0.0.6] - 2026-06-26

### Changed

- **Faster folder traversal**: directory walking now reads entries with `withFileTypes`, removing one `fs.stat` call per item, and matches extensions against a pre-built lowercase set instead of re-lowercasing the list for every file.
- **Lower memory usage on large selections**: file contents are now read sequentially instead of all at once, keeping the peak memory footprint small when copying many or large files.
- **Cleaner notifications**: skipped files (too large) and unreadable files are now reported as a single aggregated warning each, instead of one popup per file.

### Fixed

- Removed a duplicate `.pytest_cache` entry in the default `excludedFolders` list.
- The header format is now validated once instead of once per file, so a misconfigured `headerFormat` no longer spams the console while still falling back to the default.
- `tsconfig.json`: added `moduleResolution: "Node16"` to match `module: "Node16"`.

### Documentation

- Updated the README configuration table to reflect the actual default extensions and to document the `copyContents.headerFormat` setting.
- Fixed the README "Output Format" example to match the default header (`--- File: {path} ---`).

## [0.0.5] - 2026-06-23

### Added

- **Explorer multi-selection support**: both commands now operate on the entire Explorer selection (files and/or folders). Selected folders are traversed recursively, while explicitly selected files are always included regardless of the extension filter. Files are de-duplicated and the global `maxFiles` limit is respected.
- **One-click folder toggle in "Copy with Selection"**: each directory appears as a selectable header that checks/unchecks all of its files at once. Header state stays in sync when individual files are toggled.
- Visual hierarchy in the selection picker: directory separators, folder/file icons and tree-style indentation (`├` / `└`).

### Changed

- The context menu entries now appear on files as well as folders.
- Relative paths in the picker and in file headers are computed from the common parent of the selection, so files directly inside the selected folder show up under a root (`/`) group.

## [0.0.4]

- Initial release