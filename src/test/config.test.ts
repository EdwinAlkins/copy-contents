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

    test('getConfig returns default values when nothing is configured', () => {
        const mockConfig = {
            get: (key: string, defaultValue: any) => defaultValue
        };
        getConfigurationStub.returns(mockConfig as any);

        const config = getConfig();

        assert.deepStrictEqual(config.extensions, ['.ts', '.js', '.json', '.md', '.py', '.yaml']);
        assert.deepStrictEqual(config.excludedFolders, ['node_modules', '.git', '.vscode', '.DS_Store', '.idea', '.pytest_cache', '.venv', 'venv', '__MACOSX', 'Thumbs.db']);
        assert.strictEqual(config.maxFiles, 100);
        assert.strictEqual(config.maxFileSize, 1024 * 1024);
        assert.strictEqual(config.copyWithoutHeaders, false);
    });

    test('getConfig returns user values', () => {
        const mockConfig = {
            get: (key: string, defaultValue: any) => {
                if (key === 'extensions') {return ['.txt'];}
                if (key === 'excludedFolders') {return ['dist'];}
                if (key === 'maxFiles') {return 50;}
                if (key === 'maxFileSize') {return 524288;}
                if (key === 'copyWithoutHeaders') {return true;}
                return defaultValue;
            }
        };
        getConfigurationStub.returns(mockConfig as any);

        const config = getConfig();

        assert.deepStrictEqual(config.extensions, ['.txt']);
        assert.deepStrictEqual(config.excludedFolders, ['dist']);
        assert.strictEqual(config.maxFiles, 50);
        assert.strictEqual(config.maxFileSize, 524288);
        assert.strictEqual(config.copyWithoutHeaders, true);
    });
});
