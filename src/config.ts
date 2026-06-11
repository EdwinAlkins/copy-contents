import * as vscode from 'vscode';

const DEFAULT_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.py', '.yaml'];
const DEFAULT_EXCLUDED_FOLDERS = ['node_modules', '.git', '.vscode', '.DS_Store', '.idea', '.pytest_cache', '.venv', 'venv', '__MACOSX', 'Thumbs.db'];
const DEFAULT_MAX_FILES = 100;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
const DEFAULT_COPY_WITHOUT_HEADERS = false;

export interface CopyContentsConfig {
    extensions: string[];
    excludedFolders: string[];
    maxFiles: number;
    maxFileSize: number;
    copyWithoutHeaders: boolean;
}

export function getConfig(): CopyContentsConfig {
    const config = vscode.workspace.getConfiguration('copyContents');
    return {
        extensions: config.get<string[]>('extensions', DEFAULT_EXTENSIONS),
        excludedFolders: config.get<string[]>('excludedFolders', DEFAULT_EXCLUDED_FOLDERS),
        maxFiles: config.get<number>('maxFiles', DEFAULT_MAX_FILES),
        maxFileSize: config.get<number>('maxFileSize', DEFAULT_MAX_FILE_SIZE),
        copyWithoutHeaders: config.get<boolean>('copyWithoutHeaders', DEFAULT_COPY_WITHOUT_HEADERS),
    };
}