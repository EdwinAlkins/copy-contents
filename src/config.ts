import * as vscode from 'vscode';

const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.py', '.yaml', '.rs', '.toml'];
const DEFAULT_EXCLUDED_FOLDERS = ['node_modules', '.git', '.vscode', '.DS_Store', '.idea', '.pytest_cache', '.venv', 'venv', '__MACOSX', 'Thumbs.db', 'dist', 'build', 'target', '__pycache__', '.pytest_cache'];
const DEFAULT_MAX_FILES = 100;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
const DEFAULT_COPY_WITHOUT_HEADERS = false;
export const DEFAULT_HEADER_FORMAT = '--- File: {path} ---';

export interface CopyContentsConfig {
    extensions: string[];
    excludedFolders: string[];
    maxFiles: number;
    maxFileSize: number;
    copyWithoutHeaders: boolean;
    headerFormat: string;
}

export function getConfig(): CopyContentsConfig {
    const config = vscode.workspace.getConfiguration('copyContents');
    return {
        extensions: config.get<string[]>('extensions', DEFAULT_EXTENSIONS),
        excludedFolders: config.get<string[]>('excludedFolders', DEFAULT_EXCLUDED_FOLDERS),
        maxFiles: config.get<number>('maxFiles', DEFAULT_MAX_FILES),
        maxFileSize: config.get<number>('maxFileSize', DEFAULT_MAX_FILE_SIZE),
        copyWithoutHeaders: config.get<boolean>('copyWithoutHeaders', DEFAULT_COPY_WITHOUT_HEADERS),
        headerFormat: config.get<string>('headerFormat', DEFAULT_HEADER_FORMAT),
    };
}