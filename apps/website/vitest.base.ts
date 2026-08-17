import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export const websiteVitestBase = {
	plugins: [react(), tailwindcss()],
	resolve: {
		tsconfigPaths: true,
	},
	define: {
		'process.env': {},
	},
};
