import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getConfig, CopyContentsConfig, DEFAULT_HEADER_FORMAT } from './config';
import { MESSAGES } from './messages';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('copy-contents.copy', async (uri: vscode.Uri | undefined, uris?: vscode.Uri[]) => {
		await executeCopy(uri, uris);
	});

	const disposableSelection = vscode.commands.registerCommand('copy-contents.copyWithSelection', async (uri: vscode.Uri | undefined, uris?: vscode.Uri[]) => {
		await executeCopyWithSelection(uri, uris);
	});

	context.subscriptions.push(disposable, disposableSelection);
}

async function executeCopy(uri: vscode.Uri | undefined, uris?: vscode.Uri[]) {
	const targets = resolveSelection(uri, uris);
	if (targets.length === 0) {
		vscode.window.showErrorMessage(MESSAGES.ERROR.NO_FOLDER_SELECTED);
		return;
	}

	const config = getConfig();
	const { files, rootPath } = await gatherSelection(targets, config);

	if (files.length === 0) {
		vscode.window.showInformationMessage(MESSAGES.ERROR.NO_FILES_FOUND);
		return;
	}

	await copyFilesContent(files, rootPath, config);
}

async function executeCopyWithSelection(uri: vscode.Uri | undefined, uris?: vscode.Uri[]) {
	const targets = resolveSelection(uri, uris);
	if (targets.length === 0) {
		vscode.window.showErrorMessage(MESSAGES.ERROR.NO_FOLDER_SELECTED);
		return;
	}

	const config = getConfig();
	const { files, rootPath } = await gatherSelection(targets, config);

	if (files.length === 0) {
		vscode.window.showInformationMessage(MESSAGES.ERROR.NO_FILES_FOUND);
		return;
	}

	const byDir = groupFilesByDirectory(files, rootPath);
	const selectedPaths = await pickFilesWithDirectoryToggle(byDir);

	if (!selectedPaths || selectedPaths.length === 0) {return;}

	await copyFilesContent(selectedPaths, rootPath, config);
}

/**
 * Resolve the Explorer selection. VS Code passes the right-clicked resource as the
 * first argument and the full multi-selection as the second; fall back to a single
 * item (or nothing) when no multi-selection is available.
 */
function resolveSelection(uri: vscode.Uri | undefined, uris?: vscode.Uri[]): vscode.Uri[] {
	if (uris && uris.length > 0) {return uris;}
	if (uri) {return [uri];}
	return [];
}

/**
 * Walk the selected resources into a flat list of files: selected folders are
 * traversed recursively (respecting the extension/exclude/maxFiles config), while
 * explicitly selected files are always included regardless of the extension filter.
 * Also computes a shared root used to build relative paths for grouping and headers.
 */
async function gatherSelection(
	targets: vscode.Uri[],
	config: CopyContentsConfig,
): Promise<{ files: string[]; rootPath: string }> {
	const files: string[] = [];
	const seen = new Set<string>();
	const baseDirs: string[] = [];

	for (const target of targets) {
		const targetPath = target.fsPath;

		let stat;
		try {
			stat = await fs.stat(targetPath);
		} catch {
			continue; // skip resources that no longer exist
		}

		if (stat.isDirectory()) {
			baseDirs.push(targetPath);
			if (files.length < config.maxFiles) {
				const subFiles = await getAllFiles(targetPath, {
					...config,
					maxFiles: config.maxFiles - files.length,
				});
				for (const file of subFiles) {
					if (!seen.has(file)) {
						seen.add(file);
						files.push(file);
					}
				}
			}
		} else {
			baseDirs.push(path.dirname(targetPath));
			if (files.length < config.maxFiles && !seen.has(targetPath)) {
				seen.add(targetPath);
				files.push(targetPath);
			}
		}
	}

	return { files, rootPath: commonParentDir(baseDirs) };
}

/**
 * Longest directory path shared by every entry, used as the base for relative paths.
 */
function commonParentDir(dirs: string[]): string {
	if (dirs.length === 0) {return '';}

	let common = dirs[0].split(path.sep);
	for (const dir of dirs.slice(1)) {
		const segments = dir.split(path.sep);
		let i = 0;
		while (i < common.length && i < segments.length && common[i] === segments[i]) {i++;}
		common = common.slice(0, i);
	}

	const joined = common.join(path.sep);
	return joined === '' ? path.sep : joined;
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

interface FileEntry {
	label: string;
	description: string;
	absolutePath: string;
}

interface FileQuickPickItem extends vscode.QuickPickItem {
	absolutePath?: string;
	isDirHeader?: boolean;
}

function groupFilesByDirectory(filePaths: string[], rootPath: string): Map<string, FileEntry[]> {
	const byDir = new Map<string, FileEntry[]>();

	for (const filePath of filePaths) {
		const rel = path.relative(rootPath, filePath).replace(/\\/g, '/');
		const dir = path.dirname(rel) === '.' ? '/' : path.dirname(rel) + '/';
		if (!byDir.has(dir)) {
			byDir.set(dir, []);
		}
		byDir.get(dir)!.push({
			label: path.basename(filePath),
			description: rel,
			absolutePath: filePath,
		});
	}

	return byDir;
}

/**
 * Show a multi-select QuickPick where each directory is a selectable header.
 * Toggling a directory header selects/deselects all of its files in one click,
 * and the header state stays in sync when individual files are toggled.
 * Resolves with the chosen file paths, or `undefined` if the picker was dismissed.
 */
function pickFilesWithDirectoryToggle(byDir: Map<string, FileEntry[]>): Promise<string[] | undefined> {
	return new Promise((resolve) => {
		const qp = vscode.window.createQuickPick<FileQuickPickItem>();
		qp.canSelectMany = true;
		qp.title = 'Copy Folder Contents';
		qp.placeholder = 'Toggle a folder to select/deselect all its files, then press Enter';

		const items: FileQuickPickItem[] = [];
		const dirToFiles = new Map<FileQuickPickItem, FileQuickPickItem[]>();

		for (const [dir, files] of [...byDir.entries()].sort(([a], [b]) => a.localeCompare(b))) {
			const header: FileQuickPickItem = {
				label: `$(folder) ${dir}`,
				description: `— ${files.length} file${files.length > 1 ? 's' : ''}`,
				isDirHeader: true,
			};
			const fileItems: FileQuickPickItem[] = files.map((f, index) => ({
				label: `${index === files.length - 1 ? '  └ ' : '  ├ '}$(file) ${f.label}`,
				description: f.description,
				absolutePath: f.absolutePath,
			}));
			items.push({ label: '', kind: vscode.QuickPickItemKind.Separator }, header, ...fileItems);
			dirToFiles.set(header, fileItems);
		}

		const selectableItems = items.filter(item => item.kind !== vscode.QuickPickItemKind.Separator);
		qp.items = items;
		qp.selectedItems = selectableItems; // everything picked by default

		let prevSelected = new Set<FileQuickPickItem>(selectableItems);
		let reconciling = false;

		qp.onDidChangeSelection((selected) => {
			if (reconciling) {return;}

			const selectedSet = new Set(selected);
			const next = new Set(selected);

			// A directory header was toggled: apply its new state to all its files.
			for (const [header, files] of dirToFiles) {
				const wasSelected = prevSelected.has(header);
				const nowSelected = selectedSet.has(header);
				if (wasSelected !== nowSelected) {
					for (const file of files) {
						if (nowSelected) {next.add(file);} else {next.delete(file);}
					}
				}
			}

			// Keep each header in sync: checked only when all its files are checked.
			for (const [header, files] of dirToFiles) {
				const allSelected = files.length > 0 && files.every(file => next.has(file));
				if (allSelected) {next.add(header);} else {next.delete(header);}
			}

			prevSelected = next;

			const nextItems = items.filter(item => next.has(item));
			const changed = nextItems.length !== selected.length || nextItems.some(item => !selectedSet.has(item));
			if (changed) {
				reconciling = true;
				qp.selectedItems = nextItems;
				reconciling = false;
			}
		});

		let accepted = false;

		qp.onDidAccept(() => {
			accepted = true;
			const paths = qp.selectedItems
				.map(item => item.absolutePath)
				.filter((p): p is string => p !== undefined);
			qp.hide();
			resolve(paths);
		});

		qp.onDidHide(() => {
			if (!accepted) {resolve(undefined);}
			qp.dispose();
		});

		qp.show();
	});
}

export function deactivate() {}
