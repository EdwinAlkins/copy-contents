import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from './config';

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
	if (!uri) {
		vscode.window.showErrorMessage("No folder selected. Right-click a folder in the Explorer.");
		return;
	}

	const folderPath = uri.fsPath;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
	const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : folderPath;

	const config = getConfig();
	const filesToCopy = getAllFiles(folderPath, config.extensions, config.excludedFolders, config.maxFiles);
	await copyFilesContent(filesToCopy, rootPath);
}

async function executeCopyWithSelection(uri: vscode.Uri | undefined) {
	if (!uri) {
		vscode.window.showErrorMessage("No folder selected. Right-click a folder in the Explorer.");
		return;
	}

	const folderPath = uri.fsPath;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
	const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : folderPath;
	const config = getConfig();

	const allFiles = getAllFiles(folderPath, config.extensions, config.excludedFolders, config.maxFiles);

	if (allFiles.length === 0) {
		vscode.window.showInformationMessage("No files found for the configured extensions.");
		return;
	}

	// Group files by directory, sorted alphabetically
	const byDir = new Map<string, { label: string; description: string; picked: true; absolutePath: string }[]>();
	for (const filePath of allFiles) {
		const rel = path.relative(rootPath, filePath).replace(/\\/g, '/');
		const dir = path.dirname(rel) === '.' ? '/' : path.dirname(rel) + '/';
		if (!byDir.has(dir)) {
			byDir.set(dir, []);
		}
		byDir.get(dir)!.push({ label: path.basename(filePath), description: rel, picked: true, absolutePath: filePath });
	}

	const items: vscode.QuickPickItem[] = [];
	for (const [dir, files] of [...byDir.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		items.push({ label: dir, kind: vscode.QuickPickItemKind.Separator });
		items.push(...files);
	}

	const selected = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		placeHolder: 'Select files to copy to clipboard',
		title: 'Copy Folder Contents',
	});

	if (!selected || selected.length === 0) {
		return;
	}

	const selectedPaths = selected
		.map(item => (item as { absolutePath?: string }).absolutePath)
		.filter((p): p is string => p !== undefined);

	await copyFilesContent(selectedPaths, rootPath);
}

async function copyFilesContent(filePaths: string[], rootPath: string) {
	let finalText = "";

	for (const filePath of filePaths) {
		try {
			const relativePath = path.relative(rootPath, filePath).replace(/\\/g, '/');
			finalText += `\n\n--- Fichier : ${relativePath} ---\n\n`;
			finalText += fs.readFileSync(filePath, 'utf8');
		} catch (error) {
			console.error(`Failed to read ${filePath}:`, error);
		}
	}

	try {
		await vscode.env.clipboard.writeText(finalText);
		vscode.window.showInformationMessage(`${filePaths.length} file(s) copied to clipboard.`);
	} catch (error) {
		console.error('Clipboard write failed:', error);
		vscode.window.showErrorMessage("Failed to write to clipboard.");
	}
}

function getAllFiles(folderPath: string, allowedExtensions: string[], excludFolder: string[], maxFiles: number): string[] {
	let results: string[] = [];

	try {
		const list = fs.readdirSync(folderPath);

		for (const item of list) {
			const fullPath = path.join(folderPath, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				if (!excludFolder.includes(item) && results.length < maxFiles) {
					results = results.concat(getAllFiles(fullPath, allowedExtensions, excludFolder, maxFiles - results.length));
				}
			} else {
				const ext = path.extname(item);
				if ((allowedExtensions.length === 0 || allowedExtensions.includes(ext)) && results.length < maxFiles) {
					results.push(fullPath);
				}
			}
		}
	} catch (error) {
		console.error(`Failed to read directory ${folderPath}:`, error);
	}

	return results;
}

export function deactivate() {}
