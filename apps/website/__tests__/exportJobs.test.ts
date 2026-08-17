import { describe, expect, it, vi } from 'vitest';
import {
	buildExportJobCreateRequest,
	EXPORT_TYPES,
	isExportJobStatusTerminal,
	isExportJobTerminal,
	canSubmitExportOptions,
	triggerExportDownload,
} from '@/util/exportJobs';

describe('export job helpers', () => {
	it('builds a full current-version export request with explicit backend defaults', () => {
		expect(
			buildExportJobCreateRequest({
				exportType: EXPORT_TYPES.UploadsVersion,
				uuids: ['version-1'],
			}),
		).toEqual({
			export_type: 'uploads.uploadsversion',
			uuids: ['version-1'],
			metadata_format: 'json',
			include_uploads_version_file: true,
			include_uploads_version_file_metadata: true,
		});
	});

	it('builds a metadata-only dataset export request', () => {
		expect(
			buildExportJobCreateRequest({
				exportType: EXPORT_TYPES.UploadsDataset,
				uuids: ['dataset-1'],
				options: {
					includeFiles: false,
					includeMetadata: true,
					metadataFormat: 'csv',
				},
			}),
		).toEqual({
			export_type: 'uploads.uploadsdataset',
			uuids: ['dataset-1'],
			metadata_format: 'csv',
			include_uploads_version_file: false,
			include_uploads_version_file_metadata: true,
		});
	});

	it('detects terminal export job states', () => {
		expect(isExportJobStatusTerminal('FINISHED')).toBe(true);
		expect(isExportJobStatusTerminal('ERROR')).toBe(true);
		expect(isExportJobStatusTerminal('SCHEDULED')).toBe(false);
		expect(isExportJobStatusTerminal('IN_PROGRESS')).toBe(false);

		expect(isExportJobTerminal({ status: 'FINISHED' })).toBe(true);
		expect(isExportJobTerminal(undefined)).toBe(false);
	});

	it('rejects an empty export option selection', () => {
		expect(canSubmitExportOptions({ includeFiles: true, includeMetadata: false, metadataFormat: 'json' })).toBe(true);
		expect(canSubmitExportOptions({ includeFiles: false, includeMetadata: true, metadataFormat: 'xml' })).toBe(true);
		expect(canSubmitExportOptions({ includeFiles: false, includeMetadata: false, metadataFormat: 'json' })).toBe(false);
	});

	it('triggers a backend download url through a temporary anchor', () => {
		const click = vi.fn();
		const remove = vi.fn();
		const anchor = {
			click,
			remove,
			href: '',
			rel: '',
			target: '',
		};
		const documentLike = {
			createElement: vi.fn(() => anchor),
		};

		triggerExportDownload('/api/v1/export/job-1/download/', documentLike);

		expect(documentLike.createElement).toHaveBeenCalledWith('a');
		expect(anchor.href).toBe('/api/v1/export/job-1/download/');
		expect(anchor.rel).toBe('noreferrer noopener external');
		expect(anchor.target).toBe('_blank');
		expect(click).toHaveBeenCalledOnce();
		expect(remove).toHaveBeenCalledOnce();
	});
});
