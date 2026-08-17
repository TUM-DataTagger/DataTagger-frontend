/**
 * Streaming ZIP export utility with File System Access API support.
 *
 * This module provides memory-efficient file export by using:
 * 1. File System Access API (Chrome/Edge 86+) for true streaming to disk
 * 2. Fallback to buffered approach for older browsers with size limits
 *
 * Memory usage:
 * - Streaming mode: ~36MB constant regardless of file size
 * - Buffered mode: proportional to file size (limited to ~2GB)
 */

import { openAPIClient } from '@/util/clientFetch';
import { logger, LogCategory } from '@/util/logger';

/**
 * File size thresholds in bytes.
 */
const FILE_SIZE_THRESHOLDS = {
	/**
	 * Files below this require no warning
	 */
	WARN_THRESHOLD: 500 * 1_024 * 1_024, // 500 MB
	/**
	 * Files above this are blocked on non-streaming browsers
	 */
	BLOCK_THRESHOLD: 2 * 1_024 * 1_024 * 1_024, // 2 GB
} as const;

/**
 * Export capability levels based on browser support and file size.
 */
export const ExportCapability = {
	/**
	 * Can export normally (file under 500MB or streaming available)
	 */
	Available: 'available',
	/**
	 * Can export but should warn user (500MB-2GB, no streaming)
	 */
	WarningRecommended: 'warning-recommended',
	/**
	 * Cannot export safely (over 2GB, no streaming support)
	 */
	Blocked: 'blocked',
} as const;

export type ExportCapabilityType = (typeof ExportCapability)[keyof typeof ExportCapability];

/**
 * Error types for export operations.
 */
export const ExportErrorType = {
	/**
	 * User cancelled the file save dialog
	 */
	UserCancelled: 'user-cancelled',
	/**
	 * Network error during file download
	 */
	NetworkError: 'network-error',
	/**
	 * Failed to create or write to the ZIP file
	 */
	WriteError: 'write-error',
	/**
	 * File is too large for the current browser
	 */
	FileTooLarge: 'file-too-large',
	/**
	 * Unknown error occurred
	 */
	Unknown: 'unknown',
} as const;

export type ExportErrorTypeValue = (typeof ExportErrorType)[keyof typeof ExportErrorType];

/**
 * Result of an export operation.
 */
export type ExportResult = { errorType: ExportErrorTypeValue; message: string; success: false } | { success: true };

/**
 * Information about the browser's export capabilities.
 */
export type ExportCapabilityInfo = {
	/**
	 * The export capability level based on file size and browser support
	 */
	capability: ExportCapabilityType;
	/**
	 * Human-readable message about the capability
	 */
	message: string;
	/**
	 * Whether File System Access API is available for streaming
	 */
	supportsStreaming: boolean;
};

/**
 * Detects whether the File System Access API is available.
 * This API enables true streaming writes to disk.
 */
export function supportsStreamingExport(): boolean {
	return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

/**
 * Determines export capability based on file size and browser support.
 *
 * @param fileSizeBytes - Size of the file in bytes (undefined if unknown)
 * @returns Information about export capability
 */
export function getExportCapability(fileSizeBytes: number | undefined): ExportCapabilityInfo {
	const supportsStreaming = supportsStreamingExport();

	// If we don't know the file size, assume it's fine (but warn in logs)
	if (fileSizeBytes === undefined) {
		logger.debug(LogCategory.File, 'File size unknown, assuming small file for export');
		return {
			supportsStreaming,
			capability: ExportCapability.Available,
			message: 'Ready to export',
		};
	}

	// Streaming browsers can handle any size
	if (supportsStreaming) {
		return {
			supportsStreaming: true,
			capability: ExportCapability.Available,
			message: 'Ready to export with streaming',
		};
	}

	// Non-streaming browsers have size limits
	if (fileSizeBytes > FILE_SIZE_THRESHOLDS.BLOCK_THRESHOLD) {
		return {
			supportsStreaming: false,
			capability: ExportCapability.Blocked,
			message: 'This file is too large to export in your browser. Please use Chrome or Edge for files over 2 GB.',
		};
	}

	if (fileSizeBytes > FILE_SIZE_THRESHOLDS.WARN_THRESHOLD) {
		return {
			supportsStreaming: false,
			capability: ExportCapability.WarningRecommended,
			message:
				'This is a large file. Export may be slow and use significant memory. For better performance, use Chrome or Edge.',
		};
	}

	return {
		supportsStreaming: false,
		capability: ExportCapability.Available,
		message: 'Ready to export',
	};
}

/**
 * Fetches file size using a HEAD request to the download endpoint.
 * This is more efficient than fetching full metadata as it only retrieves headers.
 *
 * @param downloadUrl - URL to the file download endpoint
 * @returns File size in bytes, or undefined if not available
 */
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

/**
 * Exports a file with its metadata to a ZIP archive using streaming when available.
 *
 * @param filename - Name for the exported file (without .zip extension)
 * @param versionUuid - UUID of the file version to export
 * @param downloadUrl - URL to download the file content
 * @param fileSizeBytes - Optional file size for capability checking
 * @returns Result indicating success or failure with error details
 */
export async function exportFileWithMetadata(
	filename: string,
	versionUuid: string,
	downloadUrl: string,
	fileSizeBytes?: number,
	options?: { includeFile?: boolean },
): Promise<ExportResult> {
	const includeFile = options?.includeFile ?? true;
	const { capability, supportsStreaming } = getExportCapability(includeFile ? fileSizeBytes : 0);

	// Block export for very large files on non-streaming browsers
	if (capability === ExportCapability.Blocked) {
		return {
			success: false,
			errorType: ExportErrorType.FileTooLarge,
			message: 'This file is too large to export in your browser. Please use Chrome or Edge for files over 2 GB.',
		};
	}

	try {
		// Import client-zip dynamically
		const { downloadZip } = await import('client-zip');

		// Fetch file content and metadata in parallel (skip file download if metadata-only)
		const [fileResponse, metadataResult] = await Promise.all([
			includeFile ? fetch(downloadUrl, { credentials: 'include' }) : Promise.resolve(null),
			openAPIClient.GET('/api/v1/uploads-version/{id}/', {
				params: { path: { id: versionUuid } },
			}),
		]);

		if (includeFile && !fileResponse?.ok) {
			logger.error(LogCategory.File, 'Failed to fetch file for export', {
				versionUuid,
				status: fileResponse?.status,
			});
			return {
				success: false,
				errorType: ExportErrorType.NetworkError,
				message: `Failed to download file: ${fileResponse?.statusText ?? 'Unknown error'}`,
			};
		}

		const { data: fileMetadataData } = metadataResult;

		// Prepare metadata files
		const fileMetadata = {
			name: 'metadata.json',
			lastModified: new Date(fileMetadataData?.last_modification_date ?? 0),
			input: JSON.stringify(fileMetadataData?.version_file?.metadata ?? [], null, 2),
		};

		const additionalMetadata = {
			name: 'additional-metadata.json',
			lastModified: new Date(fileMetadataData?.last_modification_date ?? 0),
			input: JSON.stringify(fileMetadataData?.metadata ?? [], null, 2),
		};

		// Create the ZIP response (client-zip returns a Response with a streaming body)
		const zipEntries = [...(includeFile && fileResponse ? [fileResponse] : []), fileMetadata, additionalMetadata];
		const zipResponse = downloadZip(zipEntries);

		// Use streaming export for supported browsers
		if (supportsStreaming && window.showSaveFilePicker) {
			return await streamingExport(zipResponse, filename, versionUuid, fileMetadataData);
		}

		// Fall back to buffered export
		return await bufferedExport(zipResponse, filename, versionUuid, fileMetadataData);
	} catch (error) {
		// Handle user cancellation (from showSaveFilePicker)
		if (error instanceof DOMException && error.name === 'AbortError') {
			logger.info(LogCategory.File, 'File export cancelled by user', { versionUuid, filename });
			return {
				success: false,
				errorType: ExportErrorType.UserCancelled,
				message: 'Export cancelled',
			};
		}

		// Handle other errors
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logger.error(LogCategory.File, 'File export failed', {
			versionUuid,
			filename,
			error: errorMessage,
		});

		return {
			success: false,
			errorType: ExportErrorType.Unknown,
			message: `Export failed: ${errorMessage}`,
		};
	}
}

/**
 * Performs streaming export using File System Access API.
 * Memory usage remains constant (~36MB) regardless of file size.
 */
async function streamingExport(
	zipResponse: Response,
	filename: string,
	versionUuid: string,
	metadataData: { metadata?: unknown[]; version_file?: { metadata?: unknown[] } | null } | undefined,
): Promise<ExportResult> {
	// Show save file picker
	const fileHandle = await window.showSaveFilePicker!({
		suggestedName: `${filename}.zip`,
		types: [
			{
				description: 'ZIP Archive',
				accept: { 'application/zip': ['.zip'] },
			},
		],
	});

	// Get the readable stream from the response
	const zipStream = zipResponse.body;
	if (!zipStream) {
		return {
			success: false,
			errorType: ExportErrorType.WriteError,
			message: 'Failed to create ZIP stream',
		};
	}

	// Create writable stream and pipe ZIP data directly to disk
	const writableStream = await fileHandle.createWritable();
	await zipStream.pipeTo(writableStream as WritableStream<Uint8Array>);

	logger.info(LogCategory.File, 'File exported (streaming)', {
		versionUuid,
		filename,
		hasMetadata: Boolean(metadataData?.version_file?.metadata?.length),
		hasAdditionalMetadata: Boolean(metadataData?.metadata?.length),
	});

	return { success: true };
}

/**
 * Performs buffered export by creating a blob and downloading via link.
 * Warning: This buffers the entire file in memory.
 */
async function bufferedExport(
	zipResponse: Response,
	filename: string,
	versionUuid: string,
	metadataData: { metadata?: unknown[]; version_file?: { metadata?: unknown[] } | null } | undefined,
): Promise<ExportResult> {
	// Convert response to blob (buffers entire file in memory)
	const blob = await zipResponse.blob();

	// Create download link
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}.zip`;
	link.click();
	link.remove();

	// Clean up the object URL after a delay to ensure download starts
	setTimeout(() => URL.revokeObjectURL(link.href), 10_000);

	logger.info(LogCategory.File, 'File exported (buffered)', {
		versionUuid,
		filename,
		hasMetadata: Boolean(metadataData?.version_file?.metadata?.length),
		hasAdditionalMetadata: Boolean(metadataData?.metadata?.length),
	});

	return { success: true };
}
