'use client';

import { AlertCircleIcon, FolderArchiveIcon, Loader2Icon } from 'lucide-react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { useExportJobLifecycle } from '@/hooks/useExportJobLifecycle';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type MetadataTemplateExportJob = components['schemas']['MetadataTemplateExportJob'];

type MetadataTemplateExportSubmission = {
	readonly containerUuids: readonly string[];
};

type MetadataTemplateExportDialogProps = ModalOverlayProps & {
	readonly containerName?: string;
	readonly containerUuids: readonly string[];
	onJobCreated?(job: MetadataTemplateExportJob): Promise<void> | void;
	readonly title?: string;
};

async function createMetadataTemplateExportJob(
	submission: MetadataTemplateExportSubmission,
): Promise<MetadataTemplateExportJob> {
	const { data, error, response } = await openAPIClient.POST('/api/v1/metadata-template-export/', {
		body: { metadata_template_containers: [...submission.containerUuids] },
	});

	if (error || !data) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data;
}

async function retrieveMetadataTemplateExportJob(jobId: string): Promise<MetadataTemplateExportJob> {
	const { data, error, response } = await openAPIClient.GET('/api/v1/metadata-template-export/{id}/', {
		params: { path: { id: jobId } },
	});

	if (error || !data) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data;
}

export function MetadataTemplateExportDialog({
	containerName,
	containerUuids,
	onJobCreated,
	title = 'Export metadata templates',
	...props
}: MetadataTemplateExportDialogProps) {
	const lifecycle = useExportJobLifecycle({
		createJob: createMetadataTemplateExportJob,
		errorMessage: 'Metadata template export could not be started.',
		isOpen: props.isOpen,
		onJobCreated,
		onOpenChange: props.onOpenChange,
		queryKey: ['metadata-template-export-job'],
		retrieveJob: retrieveMetadataTemplateExportJob,
		startedInBackgroundMessage: 'Export started. You will receive an email when it is ready.',
		successMessage: 'Metadata template export is ready.',
	});
	const activeContainerUuids = lifecycle.submission?.containerUuids ?? containerUuids;
	const count = activeContainerUuids.length;

	const handleSubmit = () => {
		if (!count || lifecycle.isSubmitting) {
			return;
		}

		if (lifecycle.job?.status === 'ERROR') {
			lifecycle.retry();
			return;
		}

		lifecycle.start({ containerUuids: [...containerUuids] });
	};

	return (
		<ModalContent {...props} aria-label={title} onOpenChange={lifecycle.handleOpenChange}>
			<ModalHeader className="flex flex-row place-items-center gap-3 text-base-xl">
				<FolderArchiveIcon aria-hidden size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">{title}</ModalTitle>
			</ModalHeader>
			<ModalBody className="gap-4 py-1">
				{count === 1 && containerName ? (
					<p>Export “{containerName}” to a ZIP file.</p>
				) : (
					<p>
						Export {count} selected metadata template{count === 1 ? '' : 's'} to a ZIP file.
					</p>
				)}
				<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					The ZIP contains one JSON file per selected metadata template. Only the latest version is included; scope,
					users, local IDs, and version history are excluded.
				</p>
				{lifecycle.errorMessage ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{lifecycle.errorMessage}
					</Alert>
				) : null}
				{lifecycle.isPreparing ? (
					<div className="flex place-items-center gap-3 rounded-lg border border-base-neutral-100 bg-base-neutral-60 px-4 py-3 text-base-sm dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
						<Loader2Icon aria-hidden className="shrink-0 animate-spin" size={18} strokeWidth={1.5} />
						Preparing export...
					</div>
				) : null}
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={!count || lifecycle.isSubmitting} onPress={handleSubmit} type="button" variant="filled">
					{lifecycle.isSubmitting ? (
						<>
							<Loader2Icon aria-hidden className="animate-spin" data-slot="icon" size={18} strokeWidth={1.5} />
							Preparing...
						</>
					) : (
						<>
							<FolderArchiveIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							{lifecycle.job?.status === 'ERROR' ? 'Retry export' : 'Export'}
						</>
					)}
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
