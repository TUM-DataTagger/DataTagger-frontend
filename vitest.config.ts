import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: ['apps/*/vitest.config.ts'],
		passWithNoTests: true,
		coverage: {
			enabled: true,
			all: false,
			provider: 'v8',
			reporter: ['text', 'html', 'cobertura'],
			exclude: ['**/components/ui', '**/schemas', '**/styles', '**/util'],
		},
	},
});
