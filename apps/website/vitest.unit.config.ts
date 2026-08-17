import { defineProject } from 'vitest/config';
import { websiteVitestBase } from './vitest.base';

export default defineProject({
	...websiteVitestBase,
	test: {
		name: 'website-unit',
		environment: 'node',
		pool: 'vmThreads',
		include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
		exclude: ['__tests__/**/*.browser.test.ts', '__tests__/**/*.browser.test.tsx'],
	},
});
