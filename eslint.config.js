import { common, edge, next, node, prettier, react, jsxa11y, typescript } from 'eslint-config-neon';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import reactCompiler from 'eslint-plugin-react-compiler';
import merge from 'lodash.merge';
import tseslint from 'typescript-eslint';

const commonFiles = '{js,mjs,cjs,ts,mts,cts,jsx,tsx}';
const commonJSX = '{jsx,tsx}';

const commonRuleset = merge(...common, { files: [`**/*${commonFiles}`] });

const nodeRuleset = merge(...node, {
	files: [`**/*${commonFiles}`],
	rules: {
		'no-restricted-globals': 0,
		'n/prefer-global/url': 0,
		'n/prefer-global/url-search-params': 0,
		'n/prefer-global/process': 0,
	},
});

const typeScriptRuleset = merge(...typescript, {
	files: [`**/*${commonFiles}`],
	languageOptions: {
		parserOptions: {
			warnOnUnsupportedTypeScriptVersion: false,
			allowAutomaticSingleRunInference: true,
			project: ['tsconfig.eslint.json', 'apps/*/tsconfig.eslint.json', 'packages/*/tsconfig.eslint.json'],
		},
	},
	rules: {
		'@typescript-eslint/naming-convention': [
			2,
			{
				selector: 'typeParameter',
				format: ['PascalCase'],
				custom: {
					regex: '^\\w{3,}',
					match: true,
				},
			},
		],
	},
	settings: {
		'import-x/resolver-next': [
			createTypeScriptImportResolver({
				noWarnOnMultipleProjects: true,
				project: ['tsconfig.eslint.json', 'apps/*/tsconfig.eslint.json', 'packages/*/tsconfig.eslint.json'],
			}),
		],
	},
});

const reactRuleset = merge(...react, {
	files: [`apps/**/*${commonJSX}`],
	plugins: {
		'react-compiler': reactCompiler,
	},
	rules: {
		'react/jsx-handler-names': 0,
		'react-refresh/only-export-components': [0, { allowConstantExport: true }],
		'react-compiler/react-compiler': 2,
		'jsdoc/no-bad-blocks': 0,
		'tsdoc/syntax': 0,
		'@typescript-eslint/unbound-method': 0,
		'@typescript-eslint/prefer-nullish-coalescing': 0,
	},
});

const jsxa11yRuleset = merge(...jsxa11y, { files: [`apps/**/*${commonJSX}`] });

const nextRuleset = merge(...next, { files: [`apps/**/*${commonFiles}`] });

const edgeRuleset = merge(...edge, { files: [`apps/**/*${commonFiles}`] });

const prettierRuleset = merge(...prettier, { files: [`**/*${commonFiles}`] });

export default tseslint.config(
	{
		ignores: [
			'**/node_modules/',
			'.git/',
			'**/dist/',
			'**/coverage/',
			'**/.next/',
			'**/openapiSchema.ts',
			'**/old_src/',
		],
	},
	commonRuleset,
	nodeRuleset,
	typeScriptRuleset,
	reactRuleset,
	jsxa11yRuleset,
	nextRuleset,
	edgeRuleset,
	prettierRuleset,
);
