import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DownloadCapability, fetchFileSize, getDownloadCapability } from '@/util/fileDownloadCapability';

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

describe('file download capability helpers', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('getDownloadCapability handles unknown size', () => {
		expect(getDownloadCapability(undefined)).toEqual({
			capability: DownloadCapability.Available,
			message: 'Ready to download',
		});
	});

	it('getDownloadCapability warns for large files and blocks very large files', () => {
		expect(getDownloadCapability(600 * 1_024 * 1_024)).toEqual({
			capability: DownloadCapability.WarningRecommended,
			message:
				'This is a large file. Download may be slow and use significant memory. For better performance, use Chrome or Edge.',
		});

		expect(getDownloadCapability(3 * 1_024 * 1_024 * 1_024)).toEqual({
			capability: DownloadCapability.Blocked,
			message: 'This file is too large to download in your browser. Please use Chrome or Edge for files over 2 GB.',
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
