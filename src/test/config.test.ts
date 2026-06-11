import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { getConfig } from '../config';

suite('Config Test Suite', () => {
    let getConfigurationStub: sinon.SinonStub;

    setup(() => {
        // Intercepte l'appel à getConfiguration avant chaque test
        getConfigurationStub = sinon.stub(vscode.workspace, 'getConfiguration');
    });

    teardown(() => {
        // Restaure le comportement normal après chaque test
        sinon.restore();
    });

    test('getConfig retourne les valeurs par défaut si rien n\'est configuré', () => {
        const mockConfig = {
            get: (key: string, defaultValue: any) => defaultValue
        };
        getConfigurationStub.returns(mockConfig as any);

        const config = getConfig();

        assert.deepStrictEqual(config.extensions, ['.ts', '.js', '.json', '.md', '.py', '.yaml']);
        assert.deepStrictEqual(config.excludedFolders, ['node_modules', '.git', '.vscode', '.DS_Store', '.idea', '.pytest_cache', '.venv', 'venv']);
        assert.strictEqual(config.maxFiles, 100);
    });

    test('getConfig retourne les valeurs de l\'utilisateur', () => {
        const mockConfig = {
            get: (key: string, defaultValue: any) => {
                if (key === 'extensions'){ 
                    return ['.txt'];
                }
                if (key === 'excludedFolders'){ 
                    return ['dist'];
                }
                if (key === 'maxFiles'){ 
                    return 50;
                }
                return defaultValue;
            }
        };
        getConfigurationStub.returns(mockConfig as any);

        const config = getConfig();

        assert.deepStrictEqual(config.extensions, ['.txt']);
        assert.deepStrictEqual(config.excludedFolders, ['dist']);
        assert.strictEqual(config.maxFiles, 50);
    });
});
