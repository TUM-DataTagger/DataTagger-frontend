import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	test: {
		projects: ['apps/*/vitest.unit.config.ts', 'apps/*/vitest.browser.config.ts'],
		passWithNoTests: true,
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'html', 'cobertura'],
			exclude: ['**/components/ui', '**/schemas', '**/styles', '**/util'],
		},
	},
});
