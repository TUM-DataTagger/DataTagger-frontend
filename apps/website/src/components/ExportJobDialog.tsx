'use client';

import { AlertCircleIcon, FolderArchiveIcon, Loader2Icon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Field';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/Select';
import { useExportJobLifecycle } from '@/hooks/useExportJobLifecycle';
import { cx } from '@/styles/cva';
import { openAPIClient } from '@/util/clientFetch';
import {
	buildExportJobCreateRequest,
	canSubmitExportOptions,
	DEFAULT_EXPORT_CONTENT_OPTIONS,
	type ExportContentOptions,
	type ExportJob,
	type ExportType,
	type MetadataFormat,
} from '@/util/exportJobs';
import { formatErrorMessage } from '@/util/formatErrorMessage';

const METADATA_FORMAT_OPTIONS = [
	{ id: 'json', label: 'JSON' },
	{ id: 'csv', label: 'CSV' },
	{ id: 'xml', label: 'XML' },
] as const satisfies readonly { readonly id: MetadataFormat; readonly label: string }[];

const exportOptionCheckboxClassName = cx(
	'rounded-lg border border-base-neutral-100 bg-base-neutral-0 px-4 py-6.5 dark:border-base-neutral-700 dark:bg-base-neutral-800',
	'*:data-[slot=checkbox]:grid-cols-[1fr_1rem]',
	'**:data-[slot=indicator]:col-start-2',
	'**:data-[slot=label]:col-start-1',
	'**:[[slot=description]]:col-start-1',
);

type ExportJobDialogProps = ModalOverlayProps & {
	readonly defaultOptions?: ExportContentOptions | undefined;
	readonly description?: ReactNode;
	readonly exportType: ExportType;
	onJobCreated?(job: ExportJob): Promise<void> | void;
	readonly title: string;
	readonly uuids: readonly string[];
};

type ExportJobSubmission = {
	readonly exportType: ExportType;
	readonly options: ExportContentOptions;
	readonly uuids: readonly string[];
};

async function createExportJob(submission: ExportJobSubmission): Promise<ExportJob> {
	const { data, error, response } = await openAPIClient.POST('/api/v1/export/', {
		body: buildExportJobCreateRequest(submission),
	});

	if (error || !data) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data;
}

async function retrieveExportJob(jobId: string): Promise<ExportJob> {
	const { data, error, response } = await openAPIClient.GET('/api/v1/export/{id}/', {
		params: { path: { id: jobId } },
	});

	if (error || !data) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data;
}

export function ExportJobDialog({
	defaultOptions = DEFAULT_EXPORT_CONTENT_OPTIONS,
	description,
	exportType,
	onJobCreated,
	title,
	uuids,
	...props
}: ExportJobDialogProps) {
	const [options, setOptions] = useState<ExportContentOptions>(defaultOptions);
	const [submittedDescription, setSubmittedDescription] = useState<ReactNode>(null);
	const lifecycle = useExportJobLifecycle({
		createJob: createExportJob,
		errorMessage: 'Export could not be started.',
		isOpen: props.isOpen,
		onJobCreated,
		onOpenChange: props.onOpenChange,
		onReset() {
			setOptions(defaultOptions);
			setSubmittedDescription(null);
		},
		queryKey: ['export-job'],
		retrieveJob: retrieveExportJob,
	});
	const activeOptions = lifecycle.submission?.options ?? options;
	const activeUuids = lifecycle.submission?.uuids ?? uuids;
	const canSubmit = canSubmitExportOptions(activeOptions) && activeUuids.length > 0;
	const { isPreparing, isSubmitting, job } = lifecycle;
	const isEmptyExport = !canSubmitExportOptions(options);
	const visibleErrorMessage = lifecycle.errorMessage;

	const handleSubmit = () => {
		if (!canSubmit || isSubmitting) {
			return;
		}

		if (job?.status === 'ERROR') {
			lifecycle.retry();
			return;
		}

		setSubmittedDescription(description);
		lifecycle.start({ exportType, options, uuids: [...uuids] });
	};

	return (
		<ModalContent {...props} aria-label={title} onOpenChange={lifecycle.handleOpenChange}>
			<ModalHeader className="flex flex-row place-items-center gap-3 text-base-xl">
				<FolderArchiveIcon aria-hidden size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">{title}</ModalTitle>
			</ModalHeader>
			<ModalBody className="gap-4 py-1">
				{submittedDescription || description ? (
					<p className="text-pretty break-words">{submittedDescription ?? description}</p>
				) : null}
				<div className="grid gap-3">
					<Checkbox
						className={exportOptionCheckboxClassName}
						isDisabled={isSubmitting}
						isSelected={options.includeFiles}
						onChange={(includeFiles) => setOptions((current) => ({ ...current, includeFiles }))}
					>
						Include files
					</Checkbox>
					<Checkbox
						className={exportOptionCheckboxClassName}
						isDisabled={isSubmitting}
						isSelected={options.includeMetadata}
						onChange={(includeMetadata) => setOptions((current) => ({ ...current, includeMetadata }))}
					>
						Include metadata
					</Checkbox>
				</div>
				{options.includeMetadata ? (
					<Select
						isDisabled={isSubmitting}
						onChange={(key) =>
							setOptions((current) => ({
								...current,
								metadataFormat: String(key) as MetadataFormat,
							}))
						}
						value={options.metadataFormat}
					>
						<Label>Metadata format</Label>
						<SelectTrigger />
						<SelectContent items={METADATA_FORMAT_OPTIONS}>
							{(item) => (
								<SelectItem id={item.id} key={item.id}>
									<SelectLabel>{item.label}</SelectLabel>
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				) : null}
				{isEmptyExport ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						Select files, metadata, or both before exporting.
					</Alert>
				) : null}
				{visibleErrorMessage ? (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						{visibleErrorMessage}
					</Alert>
				) : null}
				{isPreparing ? (
					<div className="flex place-items-center gap-3 rounded-lg border border-base-neutral-100 bg-base-neutral-60 px-4 py-3 text-base-sm dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
						<Loader2Icon aria-hidden className="shrink-0 animate-spin" size={18} strokeWidth={1.5} />
						Preparing export...
					</div>
				) : null}
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<Button isDisabled={!canSubmit || isSubmitting} onPress={handleSubmit} type="button" variant="filled">
					{isSubmitting ? (
						<>
							<Loader2Icon aria-hidden className="animate-spin" data-slot="icon" size={18} strokeWidth={1.5} />
							Preparing...
						</>
					) : (
						<>
							<FolderArchiveIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							{job?.status === 'ERROR' ? 'Retry export' : 'Export'}
						</>
					)}
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
