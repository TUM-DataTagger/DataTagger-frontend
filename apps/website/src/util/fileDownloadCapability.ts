import { logger, LogCategory } from '@/util/logger';

const FILE_SIZE_THRESHOLDS = {
	WARN_THRESHOLD: 500 * 1_024 * 1_024,
	BLOCK_THRESHOLD: 2 * 1_024 * 1_024 * 1_024,
} as const;

export const DownloadCapability = {
	Available: 'available',
	WarningRecommended: 'warning-recommended',
	Blocked: 'blocked',
} as const;

export type DownloadCapabilityType = (typeof DownloadCapability)[keyof typeof DownloadCapability];

export type DownloadCapabilityInfo = {
	readonly capability: DownloadCapabilityType;
	readonly message: string;
};

export function getDownloadCapability(fileSizeBytes: number | undefined): DownloadCapabilityInfo {
	if (fileSizeBytes === undefined) {
		logger.debug(LogCategory.File, 'File size unknown, assuming small file for download');
		return {
			capability: DownloadCapability.Available,
			message: 'Ready to download',
		};
	}

	if (fileSizeBytes > FILE_SIZE_THRESHOLDS.BLOCK_THRESHOLD) {
		return {
			capability: DownloadCapability.Blocked,
			message: 'This file is too large to download in your browser. Please use Chrome or Edge for files over 2 GB.',
		};
	}

	if (fileSizeBytes > FILE_SIZE_THRESHOLDS.WARN_THRESHOLD) {
		return {
			capability: DownloadCapability.WarningRecommended,
			message:
				'This is a large file. Download may be slow and use significant memory. For better performance, use Chrome or Edge.',
		};
	}

	return {
		capability: DownloadCapability.Available,
		message: 'Ready to download',
	};
}

export async function fetchFileSize(downloadUrl: string): Promise<number | undefined> {
	try {
		const response = await fetch(downloadUrl, {
			method: 'HEAD',
			credentials: 'include',
		});

		if (!response.ok) {
			logger.debug(LogCategory.File, 'HEAD request failed for file size', {
				status: response.status,
				url: downloadUrl,
			});
			return undefined;
		}

		const fileSizeHeader = response.headers.get('file-size');
		if (!fileSizeHeader) {
			logger.debug(LogCategory.File, 'file-size header not present in response', { url: downloadUrl });
			return undefined;
		}

		const fileSize = Number.parseInt(fileSizeHeader, 10);
		return Number.isNaN(fileSize) ? undefined : fileSize;
	} catch (error) {
		logger.debug(LogCategory.File, 'Failed to fetch file size via HEAD request', {
			url: downloadUrl,
			error: error instanceof Error ? error.message : String(error),
		});
		return undefined;
	}
}
