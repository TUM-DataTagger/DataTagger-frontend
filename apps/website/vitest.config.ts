import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { devices } from 'playwright';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
	plugins: [tsconfigPaths(), react(), tailwindcss()],
	define: {
		'process.env': {},
	},
	test: {
		setupFiles: ['./__tests__/setup.ts'],
		name: 'website',
		css: true,
		browser: {
			enabled: true,
			provider: 'playwright',
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
