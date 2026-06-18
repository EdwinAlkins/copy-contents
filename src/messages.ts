export const MESSAGES = {
    ERROR: {
        NO_FOLDER_SELECTED: "No folder selected. Right-click a folder in the Explorer.",
        NO_FILES_FOUND: "No files found for the configured extensions.",
        CLIPBOARD_WRITE_FAILED: "Failed to write to clipboard.",
        FOLDER_DOES_NOT_EXIST: "Folder does not exist.",
        NOT_A_DIRECTORY: "Selected path is not a directory.",
        FILE_TOO_LARGE: (fileName: string, size: number, maxSize: number) =>
            `File '${fileName}' (${formatFileSize(size)}) exceeds max size (${formatFileSize(maxSize)}). Skipped.`,
        MAX_FILES_REACHED: (count: number) => `Maximum files limit (${count}) reached.`,
        FILE_READ_ERROR: (filePath: string) => `Failed to read file: ${filePath}`,
        DIRECTORY_READ_ERROR: (dirPath: string) => `Failed to read directory: ${dirPath}`,
        HEADER_FORMAT_MISSING: (filePath: string) => `Header format missing for file: ${filePath}`,
    },
    SUCCESS: {
        FILES_COPY: (count: number) => `${count} file(s) copied to clipboard.`,
    },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(2)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
