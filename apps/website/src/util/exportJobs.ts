import type { components } from '@/util/openapiSchema';

export const EXPORT_POLL_INTERVAL_MS = 2_000;

export const EXPORT_TYPES = {
	Project: 'projects.project',
	Folder: 'folders.folder',
	Subfolder: 'folders.subfolder',
	ExperimentLink: 'elabftw.experimentlink',
	UploadsDataset: 'uploads.uploadsdataset',
	UploadsVersion: 'uploads.uploadsversion',
} as const satisfies Record<string, components['schemas']['ExportTypeEnum']>;

export type ExportType = components['schemas']['ExportTypeEnum'];
export type ExportJobCreateRequest = components['schemas']['ExportJobCreateRequest'];
export type ExportJob = components['schemas']['ExportJob'];
export type ExportJobStatus = ExportJob['status'];
export type MetadataFormat = components['schemas']['MetadataFormatEnum'];

export type ExportContentOptions = {
	readonly includeFiles: boolean;
	readonly includeMetadata: boolean;
	readonly metadataFormat: MetadataFormat;
};

export const DEFAULT_EXPORT_CONTENT_OPTIONS = {
	includeFiles: true,
	includeMetadata: true,
	metadataFormat: 'json',
} as const satisfies ExportContentOptions;

// Files only, so folder exports keep the original directory structure (e.g. of NMR experiments)
export const FILES_ONLY_EXPORT_CONTENT_OPTIONS = {
	includeFiles: true,
	includeMetadata: false,
	metadataFormat: 'json',
} as const satisfies ExportContentOptions;

export function buildExportJobCreateRequest({
	exportType,
	uuids,
	options = DEFAULT_EXPORT_CONTENT_OPTIONS,
}: {
	readonly exportType: ExportType;
	readonly uuids: readonly string[];
	readonly options?: ExportContentOptions;
}): ExportJobCreateRequest {
	return {
		export_type: exportType,
		uuids: [...uuids],
		metadata_format: options.metadataFormat,
		include_uploads_version_file: options.includeFiles,
		include_uploads_version_file_metadata: options.includeMetadata,
	};
}

export function isExportJobStatusTerminal(status: ExportJobStatus | undefined): boolean {
	return status === 'FINISHED' || status === 'ERROR';
}

export function isExportJobTerminal(job: Pick<ExportJob, 'status'> | undefined): boolean {
	return isExportJobStatusTerminal(job?.status);
}

export function canSubmitExportOptions(options: ExportContentOptions): boolean {
	return options.includeFiles || options.includeMetadata;
}

export function triggerExportDownload(
	downloadUrl: string,
	documentRef: {
		createElement(tagName: 'a'): Pick<HTMLAnchorElement, 'click' | 'href' | 'rel' | 'remove' | 'target'>;
	} = document,
): void {
	const link = documentRef.createElement('a');
	link.href = downloadUrl;
	link.rel = 'noreferrer noopener external';
	link.target = '_blank';
	link.click();
	link.remove();
}
