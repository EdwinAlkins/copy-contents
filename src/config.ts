import * as vscode from 'vscode';

const DEFAULT_EXTENSIONS = ['.ts', '.js', '.json', '.md', '.py', '.yaml'];
const DEFAULT_EXCLUDED_FOLDERS = ['node_modules', '.git', '.vscode', '.DS_Store', '.idea', '.pytest_cache', '.venv', 'venv'];
const DEFAULT_MAX_FILES = 100;

export interface CopyContentsConfig {
    extensions: string[];
    excludedFolders: string[];
    maxFiles: number;
}

export function getConfig(): CopyContentsConfig {
    const config = vscode.workspace.getConfiguration('copyContents');
    return {
        extensions: config.get<string[]>('extensions', DEFAULT_EXTENSIONS),
        excludedFolders: config.get<string[]>('excludedFolders', DEFAULT_EXCLUDED_FOLDERS),
        maxFiles: config.get<number>('maxFiles', DEFAULT_MAX_FILES),
    };
}