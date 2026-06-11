import * as assert from 'assert';
import vscode = require('vscode');
import * as sinon from 'sinon';
import * as fs from 'fs/promises';
import { Stats } from 'fs';
import { activate, deactivate } from '../extension';
import { MESSAGES } from '../messages';

suite('Extension Test Suite', () => {
    let commandCallback: any;
    let commandSelectionCallback: any;

    setup(() => {
        sinon.stub(vscode.commands, 'registerCommand').callsFake((cmd, cb) => {
            if (cmd === 'copy-contents.copy') {
                commandCallback = cb;
            }
            if (cmd === 'copy-contents.copyWithSelection') {
                commandSelectionCallback = cb;
            }
            return { dispose: () => {} };
        });

        const context = { subscriptions: [] } as any;
        activate(context);
    });

    teardown(() => {
        sinon.restore();
    });

    test('Deactivate does not throw any error', () => {
        assert.doesNotThrow(() => deactivate());
    });

    test('Command shows error if no URI is provided', async () => {
        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        
        await commandCallback(undefined);
        
        assert.ok(showErrorStub.calledWith(MESSAGES.ERROR.NO_FOLDER_SELECTED));
    });

    test('Command shows error if path is not a directory', async () => {
        const mockUri = vscode.Uri.file('/mock/file.txt');
        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        
        sinon.stub(fs, 'stat').resolves({ isDirectory: () => false } as Stats);
        
        await commandCallback(mockUri);
        
        assert.ok(showErrorStub.calledWith(MESSAGES.ERROR.NOT_A_DIRECTORY));
    });

    test('Command shows error if folder does not exist', async () => {
        const mockUri = vscode.Uri.file('/nonexistent/path');
        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        
        sinon.stub(fs, 'stat').rejects(new Error('Not found'));
        
        await commandCallback(mockUri);
        
        assert.ok(showErrorStub.calledWith(MESSAGES.ERROR.FOLDER_DOES_NOT_EXIST));
    });

    test('Command copies files successfully with recursion and filtering', async () => {
        const mockUri = vscode.Uri.file('/mock/path');

        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns({
            uri: vscode.Uri.file('/mock'),
            name: 'mock',
            index: 0
        });

        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {return ['.ts'];}
                if (key === 'excludedFolders') {return ['node_modules'];}
                if (key === 'maxFiles') {return 10;}
                if (key === 'maxFileSize') {return 1048576;}
                if (key === 'copyWithoutHeaders') {return false;}
                return def;
            }
        } as any);

        const readdirStub = sinon.stub(fs, 'readdir');
        const statStub = sinon.stub(fs, 'stat');
        const readFileStub = sinon.stub(fs, 'readFile');

        readdirStub.withArgs('/mock/path').resolves(['file1.ts', 'file2.js', 'node_modules', 'sub'] as any);
        readdirStub.withArgs('/mock/path/sub').resolves(['file3.ts', 'file4.ts'] as any);
        readdirStub.withArgs('/mock/path/node_modules').resolves([] as any);

        statStub.callsFake((filePath: any) => {
            const p = filePath.toString();
            if (p.endsWith('node_modules') || p.endsWith('sub')) {
                return Promise.resolve({ isDirectory: () => true, size: 100 } as Stats);
            }
            return Promise.resolve({ isDirectory: () => false, size: 100 } as Stats);
        });

        readFileStub.withArgs('/mock/path/file1.ts').resolves('content1');
        readFileStub.withArgs('/mock/path/sub/file3.ts').resolves('content3');
        readFileStub.withArgs('/mock/path/sub/file4.ts').rejects(new Error('Read error'));

        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        const consoleErrorStub = sinon.stub(console, 'error');
        const showWarningStub = sinon.stub(vscode.window, 'showWarningMessage');

        await commandCallback(mockUri);

        assert.ok(clipboardStub.calledOnce);
        const clipboardText = clipboardStub.firstCall.args[0];
        
        assert.ok(clipboardText.includes('content1'), 'Clipboard must contain file1.ts');
        assert.ok(clipboardText.includes('content3'), 'Clipboard must contain file3.ts in subfolder');
        assert.ok(!clipboardText.includes('file2.js'), 'Must not include unauthorized extensions');
        assert.ok(clipboardText.includes('--- File:'), 'Must include file headers');

        assert.ok(consoleErrorStub.calledWith(sinon.match(/Failed to read file/), sinon.match.any));
        assert.ok(showWarningStub.calledWith(sinon.match(/Failed to read file/)));
        assert.ok(showInfoStub.calledWith(MESSAGES.SUCCESS.FILES_COPY(2)));
    });

    test('Command respects maxFiles limit', async () => {
        const mockUri = vscode.Uri.file('/mock/path');

        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {return [];}
                if (key === 'excludedFolders') {return [];}
                if (key === 'maxFiles') {return 1;}
                if (key === 'maxFileSize') {return 1048576;}
                if (key === 'copyWithoutHeaders') {return false;}
                return def;
            }
        } as any);

        const readdirStub = sinon.stub(fs, 'readdir');
        const statStub = sinon.stub(fs, 'stat');
        const readFileStub = sinon.stub(fs, 'readFile');

        readdirStub.withArgs('/mock/path').resolves(['file1.txt', 'subDir'] as any);
        readdirStub.withArgs('/mock/path/subDir').resolves(['file2.txt'] as any);

        statStub.callsFake((filePath: any) => {
            const p = filePath.toString();
            return Promise.resolve({
                isDirectory: () => p.endsWith('subDir'),
                size: 100
            } as Stats);
        });

        readFileStub.resolves('content');

        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        await commandCallback(mockUri);

        const clipboardText = clipboardStub.firstCall.args[0];
        assert.strictEqual(clipboardText.split('--- File:').length - 1, 1, 'Should only copy 1 file due to maxFiles limit');
    });

    test('Command respects maxFileSize limit', async () => {
        const mockUri = vscode.Uri.file('/mock/path');

        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {return ['.txt'];}
                if (key === 'excludedFolders') {return [];}
                if (key === 'maxFiles') {return 100;}
                if (key === 'maxFileSize') {return 100;}
                if (key === 'copyWithoutHeaders') {return false;}
                return def;
            }
        } as any);

        const readdirStub = sinon.stub(fs, 'readdir');
        const statStub = sinon.stub(fs, 'stat');

        readdirStub.withArgs('/mock/path').resolves(['large.txt', 'small.txt'] as any);

        statStub.callsFake((filePath: any) => {
            const p = filePath.toString();
            if (p.endsWith('large.txt')) {
                return Promise.resolve({ isDirectory: () => false, size: 200 } as Stats);
            }
            return Promise.resolve({ isDirectory: () => false, size: 50 } as Stats);
        });

        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        const showWarningStub = sinon.stub(vscode.window, 'showWarningMessage');

        await commandCallback(mockUri);

        assert.ok(showWarningStub.calledWith(sinon.match(/exceeds max size/)));
        const clipboardText = clipboardStub.firstCall.args[0];
        assert.ok(!clipboardText.includes('large.txt'), 'Large file should be skipped');
        assert.ok(clipboardText.includes('small.txt'), 'Small file should be included');
    });

    test('Command with copyWithoutHeaders option removes file headers', async () => {
        const mockUri = vscode.Uri.file('/mock/path');

        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {return ['.txt'];}
                if (key === 'excludedFolders') {return [];}
                if (key === 'maxFiles') {return 100;}
                if (key === 'maxFileSize') {return 1048576;}
                if (key === 'copyWithoutHeaders') {return true;}
                return def;
            }
        } as any);

        const readdirStub = sinon.stub(fs, 'readdir');
        const statStub = sinon.stub(fs, 'stat');
        const readFileStub = sinon.stub(fs, 'readFile');

        readdirStub.withArgs('/mock/path').resolves(['file1.txt'] as any);
        statStub.resolves({ isDirectory: () => false, size: 100 } as Stats);
        readFileStub.withArgs('/mock/path/file1.txt').resolves('content1');

        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        await commandCallback(mockUri);

        const clipboardText = clipboardStub.firstCall.args[0];
        assert.ok(!clipboardText.includes('--- File:'), 'Headers should be removed');
        assert.strictEqual(clipboardText, 'content1', 'Should only contain file content');
    });

    test('Clipboard write error is handled', async () => {
        const mockUri = vscode.Uri.file('/mock/path');
        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        sinon.stub(fs, 'readdir').resolves([] as any);

        const clipboardStub = sinon.stub().rejects(new Error('Clipboard error'));
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        const consoleErrorStub = sinon.stub(console, 'error');

        await commandCallback(mockUri);

        assert.ok(clipboardStub.calledOnce);
        assert.ok(showErrorStub.calledWith(MESSAGES.ERROR.CLIPBOARD_WRITE_FAILED));
        assert.ok(consoleErrorStub.calledWith(MESSAGES.ERROR.CLIPBOARD_WRITE_FAILED, sinon.match.any));
    });

    test('Directory read error is handled', async () => {
        const mockUri = vscode.Uri.file('/mock/path');
        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        
        sinon.stub(fs, 'stat').resolves({ isDirectory: () => true } as Stats);
        sinon.stub(fs, 'readdir').rejects(new Error('FS Permission Error'));

        const consoleErrorStub = sinon.stub(console, 'error');
        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');

        await commandCallback(mockUri);

        assert.ok(consoleErrorStub.calledWith(sinon.match(/Failed to read directory/), sinon.match.any));
        assert.ok(!showInfoStub.called);
    });

    test('No files found shows information message', async () => {
        const mockUri = vscode.Uri.file('/mock/path');
        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined);
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {return ['.ts'];}
                if (key === 'excludedFolders') {return [];}
                if (key === 'maxFiles') {return 100;}
                if (key === 'maxFileSize') {return 1048576;}
                if (key === 'copyWithoutHeaders') {return false;}
                return def;
            }
        } as any);

        sinon.stub(fs, 'stat').resolves({ isDirectory: () => true } as Stats);
        sinon.stub(fs, 'readdir').resolves([] as any);

        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');

        await commandSelectionCallback(mockUri);

        assert.ok(showInfoStub.calledWith(MESSAGES.ERROR.NO_FILES_FOUND));
    });
});
