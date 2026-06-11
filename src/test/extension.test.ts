import * as assert from 'assert';
import vscode = require('vscode');
import * as sinon from 'sinon';
import fs = require('fs');
import { activate, deactivate } from '../extension';

suite('Extension Test Suite', () => {
    let commandCallback: any;

    setup(() => {
        // On intercepte l'enregistrement de la commande pour récupérer la fonction interne
        sinon.stub(vscode.commands, 'registerCommand').callsFake((cmd, cb) => {
            if (cmd === 'copy-contents.copy') {
                commandCallback = cb;
            }
            return { dispose: () => {} };
        });

        // On active l'extension en lui passant un faux contexte
        const context = { subscriptions: [] } as any;
        activate(context);
    });

    teardown(() => {
        sinon.restore();
    });

    test('Deactivate ne lève aucune erreur', () => {
        assert.doesNotThrow(() => deactivate());
    });

    test('La commande affiche une erreur si aucune URI n\'est fournie', async () => {
        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        
        await commandCallback(undefined);
        
        assert.ok(showErrorStub.calledWith("Aucun dossier sélectionné. Veuillez faire un clic droit sur un dossier."));
    });

    test('La commande copie les fichiers avec succès (récursion & filtrage)', async () => {
        const mockUri = vscode.Uri.file('/mock/path');

        // Mock du workspace
        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns({
            uri: vscode.Uri.file('/mock'),
            name: 'mock',
            index: 0
        });

        // Mock de la configuration
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {
                    return ['.ts'];
                }
                if (key === 'excludedFolders') {
                    return ['node_modules'];
                }
                if (key === 'maxFiles') {
                    return 10;
                }
                return def;
            }
        } as any);

        // Mock du système de fichiers
        const readdirStub = sinon.stub(fs, 'readdirSync');
        const statStub = sinon.stub(fs, 'statSync');
        const readFileStub = sinon.stub(fs, 'readFileSync');

        readdirStub.withArgs(sinon.match(/path$/)).returns(['file1.ts', 'file2.js', 'node_modules', 'sub'] as any);
        readdirStub.withArgs(sinon.match(/sub$/)).returns(['file3.ts', 'file4.ts'] as any);

        statStub.callsFake((filePath: any) => {
            const p = filePath.toString();
            return { isDirectory: () => p.endsWith('node_modules') || p.endsWith('sub') } as fs.Stats;
        });

        readFileStub.withArgs(sinon.match(/file1\.ts$/)).returns('content1');
        readFileStub.withArgs(sinon.match(/file3\.ts$/)).returns('content3');
        readFileStub.withArgs(sinon.match(/file4\.ts$/)).throws(new Error('Read error'));

        // Mock du presse-papiers
        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        
        // On rend le stub muet pour nettoyer la console pendant les tests
        const consoleErrorStub = sinon.stub(console, 'error'); 

        await commandCallback(mockUri);

        assert.ok(clipboardStub.calledOnce);
        const clipboardText = clipboardStub.firstCall.args[0];
        
        assert.ok(clipboardText.includes('content1'), 'Le presse-papiers doit contenir file1.ts');
        assert.ok(clipboardText.includes('content3'), 'Le presse-papiers doit contenir file3.ts dans le sous-dossier');
        assert.ok(!clipboardText.includes('file2.js'), 'Ne doit pas inclure les extensions non autorisées');

        // Ajout de sinon.match.any pour valider le 2ème argument (l'objet d'erreur)
        assert.ok(consoleErrorStub.calledWith(sinon.match(/Erreur lors de la lecture du fichier/), sinon.match.any));
        assert.ok(showInfoStub.calledWith('Fichiers copiés dans le presse-papiers avec succès !'));
    });

    test('Gestion des erreurs du presse-papiers (copyTextToClipboard catch)', async () => {
        const mockUri = vscode.Uri.file('/mock/path');
        sinon.stub(vscode.workspace, 'getWorkspaceFolder').returns(undefined); 
        sinon.stub(fs, 'readdirSync').returns([]); 
        
        // Mock du presse-papiers (Cas d'erreur)
        const clipboardStub = sinon.stub().rejects(new Error('Clipboard error'));
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');
        const consoleErrorStub = sinon.stub(console, 'error');

        await commandCallback(mockUri);

        assert.ok(clipboardStub.calledOnce);
        assert.ok(showErrorStub.calledWith("Une erreur est survenue lors de la copie dans le presse-papiers."));
        
        // Ajout de sinon.match.any pour le 2ème argument
        assert.ok(consoleErrorStub.calledWith('Erreur lors de la copie:', sinon.match.any));
    });

    test('getAllFiles respecte maxFiles, les extensions vides, et attrape les erreurs FS', async () => {
         const mockUri = vscode.Uri.file('/mock/path');

         sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string, def: any) => {
                if (key === 'extensions') {
                    return []; 
                }
                if (key === 'maxFiles') {
                    return 1; 
                }
                return def;
            }
        } as any);

        const readdirStub = sinon.stub(fs, 'readdirSync');
        const statStub = sinon.stub(fs, 'statSync');

        readdirStub.onFirstCall().returns(['file1.txt', 'subDir'] as any);
        statStub.callsFake((filePath: any) => {
            return { isDirectory: () => filePath.toString().endsWith('subDir') } as fs.Stats;
        });

        // Mock du presse-papiers
        const clipboardStub = sinon.stub().resolves();
        sinon.stub(vscode.env, 'clipboard').get(() => ({
            writeText: clipboardStub,
            readText: async () => ''
        }));

        sinon.stub(fs, 'readFileSync').returns('content');

        await commandCallback(mockUri);

        const clipboardText = clipboardStub.firstCall.args[0];
        assert.strictEqual(clipboardText.split('--- Fichier').length - 1, 1);

        readdirStub.onSecondCall().throws(new Error('FS Permission Error'));
        const consoleErrorStub = sinon.stub(console, 'error');

        await commandCallback(mockUri);
        
        // Ajout de sinon.match.any pour le 2ème argument
        assert.ok(consoleErrorStub.calledWith(sinon.match(/Erreur lors de la lecture du dossier/), sinon.match.any));
    });
});