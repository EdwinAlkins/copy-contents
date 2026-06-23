# Change Log

All notable changes to the "copy-contents" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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