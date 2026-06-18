import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getConfig, CopyContentsConfig, DEFAULT_HEADER_FORMAT } from './config';
import { MESSAGES } from './messages';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('copy-contents.copy', async (uri: vscode.Uri | undefined) => {
		await executeCopy(uri);
	});

	const disposableSelection = vscode.commands.registerCommand('copy-contents.copyWithSelection', async (uri: vscode.Uri | undefined) => {
		await executeCopyWithSelection(uri);
	});

	context.subscriptions.push(disposable, disposableSelection);
}

async function executeCopy(uri: vscode.Uri | undefined) {
	const validation = await validateFolderPath(uri);
	if (!validation) {return;}

	const { folderPath, uriObject } = validation;
	const rootPath = getRootPath(uriObject, folderPath);
	const config = getConfig();
	const filesToCopy = await getAllFiles(folderPath, config);
	await copyFilesContent(filesToCopy, rootPath, config);
}

async function executeCopyWithSelection(uri: vscode.Uri | undefined) {
	const validation = await validateFolderPath(uri);
	if (!validation) {return;}

	const { folderPath, uriObject } = validation;
	const rootPath = getRootPath(uriObject, folderPath);
	const config = getConfig();
	const allFiles = await getAllFiles(folderPath, config);

	if (allFiles.length === 0) {
		vscode.window.showInformationMessage(MESSAGES.ERROR.NO_FILES_FOUND);
		return;
	}

	const byDir = groupFilesByDirectory(allFiles, rootPath);
	const items = buildQuickPickItems(byDir);

	const selected = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		placeHolder: 'Select files to copy to clipboard',
		title: 'Copy Folder Contents',
	});

	if (!selected || selected.length === 0) {return;}

	const selectedPaths = selected
		.map(item => (item as { absolutePath?: string }).absolutePath)
		.filter((p): p is string => p !== undefined);

	await copyFilesContent(selectedPaths, rootPath, config);
}

async function validateFolderPath(uri: vscode.Uri | undefined): Promise<{ folderPath: string; uriObject: vscode.Uri } | null> {
	if (!uri) {
		vscode.window.showErrorMessage(MESSAGES.ERROR.NO_FOLDER_SELECTED);
		return null;
	}

	const folderPath = uri.fsPath;
	
	try {
		const stat = await fs.stat(folderPath);
		if (!stat.isDirectory()) {
			vscode.window.showErrorMessage(MESSAGES.ERROR.NOT_A_DIRECTORY);
			return null;
		}
	} catch {
		vscode.window.showErrorMessage(MESSAGES.ERROR.FOLDER_DOES_NOT_EXIST);
		return null;
	}

	return { folderPath, uriObject: uri };
}

function getRootPath(uri: vscode.Uri, folderPath: string): string {
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
	return workspaceFolder ? workspaceFolder.uri.fsPath : folderPath;
}

async function copyFilesContent(filePaths: string[], rootPath: string, config: CopyContentsConfig) {
	const contents = await Promise.all(
		filePaths.map(async (filePath) => {
			try {
				const stat = await fs.stat(filePath);
				if (stat.size > config.maxFileSize) {
					console.warn(MESSAGES.ERROR.FILE_TOO_LARGE(filePath, stat.size, config.maxFileSize));
					vscode.window.showWarningMessage(MESSAGES.ERROR.FILE_TOO_LARGE(path.basename(filePath), stat.size, config.maxFileSize));
					return null;
				}
				
				const relativePath = path.relative(rootPath, filePath).replace(/\\/g, '/');
				const fileContent = await fs.readFile(filePath, 'utf8');
				
				if (config.copyWithoutHeaders) {
					return fileContent;
				}
				let headerFormat: string = config.headerFormat;
				if (!headerFormat.includes('{path}')) {
					console.warn(MESSAGES.ERROR.HEADER_FORMAT_MISSING(filePath));
					headerFormat = DEFAULT_HEADER_FORMAT;
				}
				const header = headerFormat.replace(/\{path\}/g, relativePath);
				return `\n\n${header}\n\n${fileContent}`;
			} catch (error) {
				console.error(MESSAGES.ERROR.FILE_READ_ERROR(filePath), error);
				vscode.window.showWarningMessage(MESSAGES.ERROR.FILE_READ_ERROR(filePath));
				return null;
			}
		})
	);

	const validContents = contents.filter((content): content is string => content !== null);
	const finalText = validContents.join('');

	if (validContents.length === 0) {return;}

	try {
		await vscode.env.clipboard.writeText(finalText);
		vscode.window.showInformationMessage(MESSAGES.SUCCESS.FILES_COPY(validContents.length));
	} catch (error) {
		console.error(MESSAGES.ERROR.CLIPBOARD_WRITE_FAILED, error);
		vscode.window.showErrorMessage(MESSAGES.ERROR.CLIPBOARD_WRITE_FAILED);
	}
}

async function getAllFiles(folderPath: string, config: CopyContentsConfig): Promise<string[]> {
	let results: string[] = [];

	try {
		const list = await fs.readdir(folderPath);

		for (const item of list) {
			if (results.length >= config.maxFiles) {break;}

			const fullPath = path.join(folderPath, item);
			const stat = await fs.stat(fullPath);

			if (stat.isDirectory()) {
				if (!config.excludedFolders.includes(item)) {
					const subFiles = await getAllFiles(fullPath, {
						...config,
						maxFiles: config.maxFiles - results.length,
					});
					results = results.concat(subFiles);
				}
			} else {
				const ext = path.extname(item).toLowerCase();
				const allowedExt = config.extensions.map(e => e.toLowerCase());
				
				if (allowedExtensionsMatch(ext, allowedExt, config.extensions) && results.length < config.maxFiles) {
					results.push(fullPath);
				}
			}
		}
	} catch (error) {
		console.error(MESSAGES.ERROR.DIRECTORY_READ_ERROR(folderPath), error);
	}

	return results;
}

function allowedExtensionsMatch(fileExt: string, allowedExt: string[], originalAllowed: string[]): boolean {
	// If no extensions configured, allow all
	if (originalAllowed.length === 0) {return true;}
	// Check against lowercase versions
	return allowedExt.includes(fileExt);
}

function groupFilesByDirectory(filePaths: string[], rootPath: string): Map<string, { label: string; description: string; picked: true; absolutePath: string }[]> {
	const byDir = new Map<string, { label: string; description: string; picked: true; absolutePath: string }[]>();

	for (const filePath of filePaths) {
		const rel = path.relative(rootPath, filePath).replace(/\\/g, '/');
		const dir = path.dirname(rel) === '.' ? '/' : path.dirname(rel) + '/';
		if (!byDir.has(dir)) {
			byDir.set(dir, []);
		}
		byDir.get(dir)!.push({ 
			label: path.basename(filePath), 
			description: rel, 
			picked: true, 
			absolutePath: filePath 
		});
	}

	return byDir;
}

function buildQuickPickItems(byDir: Map<string, { label: string; description: string; picked: true; absolutePath: string }[]>): vscode.QuickPickItem[] {
	const items: vscode.QuickPickItem[] = [];
	for (const [dir, files] of [...byDir.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		items.push({ label: dir, kind: vscode.QuickPickItemKind.Separator });
		items.push(...files);
	}
	return items;
}

export function deactivate() {}
