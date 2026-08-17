import { playwright } from '@vitest/browser-playwright';
import { devices } from 'playwright';
import { defineProject } from 'vitest/config';
import { websiteVitestBase } from './vitest.base';

export default defineProject({
	...websiteVitestBase,
	test: {
		name: 'website-browser',
		css: true,
		fileParallelism: false,
		setupFiles: ['./__tests__/setup.browser.ts'],
		include: ['__tests__/**/*.browser.test.ts', '__tests__/**/*.browser.test.tsx'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [
				{
					name: 'desktop',
					browser: 'chromium',
					headless: true,
					viewport: devices['Desktop Chrome'].viewport,
				},
				{
					name: 'mobile',
					browser: 'chromium',
					headless: true,
					viewport: devices['iPhone 12 Pro'].viewport,
				},
			],
		},
	},
});
