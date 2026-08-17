import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ExportCapability,
	fetchFileSize,
	getExportCapability,
	supportsStreamingExport,
} from '@/util/streamingZipExport';

vi.mock('@/util/clientFetch', () => ({
	openAPIClient: {
		GET: vi.fn(),
	},
}));

vi.mock('@/util/logger', () => ({
	LogCategory: { File: 'File' },
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

describe('streamingZipExport capability helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('supportsStreamingExport reflects showSaveFilePicker availability', () => {
		vi.stubGlobal('window', {});
		expect(supportsStreamingExport()).toBe(false);

		vi.stubGlobal('window', { showSaveFilePicker: vi.fn() });
		expect(supportsStreamingExport()).toBe(true);
	});

	it('getExportCapability handles unknown size and streaming-browser paths', () => {
		vi.stubGlobal('window', {});
		expect(getExportCapability(undefined)).toEqual({
			capability: ExportCapability.Available,
			message: 'Ready to export',
			supportsStreaming: false,
		});

		vi.stubGlobal('window', { showSaveFilePicker: vi.fn() });
		expect(getExportCapability(10 * 1_024 * 1_024 * 1_024)).toEqual({
			capability: ExportCapability.Available,
			message: 'Ready to export with streaming',
			supportsStreaming: true,
		});
	});

	it('getExportCapability warns for large files and blocks very large files without streaming', () => {
		vi.stubGlobal('window', {});

		expect(getExportCapability(600 * 1_024 * 1_024)).toEqual({
			capability: ExportCapability.WarningRecommended,
			message:
				'This is a large file. Export may be slow and use significant memory. For better performance, use Chrome or Edge.',
			supportsStreaming: false,
		});

		expect(getExportCapability(3 * 1_024 * 1_024 * 1_024)).toEqual({
			capability: ExportCapability.Blocked,
			message: 'This file is too large to export in your browser. Please use Chrome or Edge for files over 2 GB.',
			supportsStreaming: false,
		});
	});

	it('fetchFileSize returns undefined for missing header, invalid header, non-ok status, and fetch errors', async () => {
		const fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);

		fetchMock.mockResolvedValueOnce(new Response('', { status: 200, headers: {} }));
		await expect(fetchFileSize('/api/files/1')).resolves.toBeUndefined();

		fetchMock.mockResolvedValueOnce(
			new Response('', {
				status: 200,
				headers: { 'file-size': 'not-a-number' },
			}),
		);
		await expect(fetchFileSize('/api/files/1')).resolves.toBeUndefined();

		fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
		await expect(fetchFileSize('/api/files/1')).resolves.toBeUndefined();

		fetchMock.mockRejectedValueOnce(new Error('network down'));
		await expect(fetchFileSize('/api/files/1')).resolves.toBeUndefined();
	});
});
