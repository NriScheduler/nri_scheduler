import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const VITE_PORT = parseInt(process.env.VITE_PORT);


// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
	if (command === 'serve' && !VITE_PORT) {
		throw new Error('VITE_PORT environment variable is not defined');
	}

	return {
		envPrefix: 'CLIENT_',
		root: 'client',
		build: {
			cssMinify: 'esbuild',
			minify:    'terser',
			outDir:    '../static',
			emptyOutDir: true,
		},
		server: {
			host:       '0.0.0.0',
			port:       VITE_PORT,
			strictPort: true,
			hmr:        {
				host:       '0.0.0.0',
				clientPort: VITE_PORT,
				port:       VITE_PORT,
				path:       '/hmr',
			},
		},
		preview: {
			host:       '0.0.0.0',
			port:       VITE_PORT,
			strictPort: true,
		},
		resolve: {
			alias: {
				...(command === 'build' ? {} : {
					'fs':            '',
					'path':          '',
					'source-map-js': '',
					'url':           '',
				}),
			},
		},
		jsx: {
			factory: 'h',
			fragment: 'Fragment',
		},
		plugins: [react()],
	};
});
