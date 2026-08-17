'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	AlertCircleIcon,
	BlocksIcon,
	FileStackIcon,
	HelpCircleIcon,
	Loader2Icon,
	NotepadTextDashedIcon,
	TextCursorInputIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { MetadataTemplateFieldValueEditor, mergeMetadataValueEditorChange } from '@/components/MetadataValueEditor';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Form, useDialogForm } from '@/components/ui/Form';
import { Link } from '@/components/ui/Link';
import {
	ModalBody,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	type ModalContentProps,
} from '@/components/ui/Modal';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useExitFilesBulkMode } from '@/hooks/useExitFilesBulkMode';
import { cx } from '@/styles/cva';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';
import { getMetadataChoiceWriteValidationMessage } from '@/util/metadataOptionValidation';
import type { components } from '@/util/openapiSchema';
import { trimMetadataPayload } from '@/util/trimMetadataPayload';
import type { MetadataFieldConfig } from './Metadata';
import { DialogCloseIcon } from './ui/Dialog';

export type BulkFillMetadataTemplateFieldsPreflightResponse =
	components['schemas']['UploadsDatasetBulkFillMetadataTemplateFieldsResponse'];

type BulkFillMetadataTemplateFieldsApplyResponse =
	components['schemas']['UploadsDatasetBulkFillMetadataTemplateFieldsSubmitResponse'];

type BulkFillMetadataTemplateFieldsSubmitPayload =
	components['schemas']['UploadsDatasetBulkFillMetadataTemplateFieldsSubmitPayloadRequest'];

type BulkFillMetadataTemplateFieldsEligibleDataset =
	BulkFillMetadataTemplateFieldsPreflightResponse['eligible_uploads_datasets'][number];

type BulkFillMetadataTemplateFieldState = BulkFillMetadataTemplateFieldsPreflightResponse['fields'][number] & {
	readonly config: MetadataFieldConfig;
	readonly selected: boolean;
	readonly value: unknown;
};

const BULK_FILL_METADATA_TEMPLATE_FIELDS_TITLE = 'Fill-in metadata template fields';
const DIFFERENT_DATASET_METADATA_TEMPLATES_WARNING = 'DIFFERENT_DATASET_METADATA_TEMPLATES';

async function bulkFillMetadataTemplateFieldsPreflight(input: {
	readonly uploads_datasets: string[];
}): Promise<BulkFillMetadataTemplateFieldsPreflightResponse> {
	const { data, error, response } = await openAPIClient.POST(
		'/api/v1/uploads-dataset/bulk-fill-metadata-template-fields/',
		{
			body: input,
		},
	);

	if (error) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data as BulkFillMetadataTemplateFieldsPreflightResponse;
}

async function bulkFillMetadataTemplateFieldsApply(
	input: BulkFillMetadataTemplateFieldsSubmitPayload,
): Promise<BulkFillMetadataTemplateFieldsApplyResponse> {
	const { data, error, response } = await openAPIClient.POST(
		'/api/v1/uploads-dataset/bulk-fill-metadata-template-fields-submit/',
		{
			body: input,
		},
	);

	if (error) {
		throw new Error(formatErrorMessage(error, response));
	}

	return data as BulkFillMetadataTemplateFieldsApplyResponse;
}

function normalizeFieldConfig(config: unknown, guidance?: string | null): MetadataFieldConfig {
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return guidance ? { description: guidance } : {};
	}

	const normalizedConfig = config as MetadataFieldConfig;
	if (typeof normalizedConfig.description === 'string' || !guidance) {
		return normalizedConfig;
	}

	return {
		...normalizedConfig,
		description: guidance,
	};
}

function getWarningHelpText(skipReasons: BulkFillMetadataTemplateFieldsPreflightResponse['skip_reasons']) {
	const pendingUpgradeCount = skipReasons.find((reason) => reason.code === 'PENDING_TEMPLATE_UPGRADE')?.count ?? 0;

	if (pendingUpgradeCount <= 0) {
		return 'Some selected files are not eligible for bulk fill.';
	}

	return `${pendingUpgradeCount} selected file${pendingUpgradeCount === 1 ? ' is' : 's are'} waiting for an inherited metadata template upgrade.`;
}

function hasDifferentDatasetMetadataTemplatesWarning(data: BulkFillMetadataTemplateFieldsPreflightResponse) {
	return data.warnings.some((warning) => warning.code === DIFFERENT_DATASET_METADATA_TEMPLATES_WARNING);
}

function hasPendingTemplateUpgradeSkip(data: BulkFillMetadataTemplateFieldsPreflightResponse) {
	return Boolean(data.has_skipped_due_to_pending_template_upgrade && data.skipped_uploads_datasets_count > 0);
}

function createInitialFieldState(
	fields: BulkFillMetadataTemplateFieldsPreflightResponse['fields'],
): BulkFillMetadataTemplateFieldState[] {
	return fields.map((field) => ({
		...field,
		config: normalizeFieldConfig(field.config),
		selected: !field.various_inputs,
		value: field.value ?? null,
	}));
}

function BulkFillMetadataTemplateFieldLabel(props: {
	readonly customKey: string;
	readonly metadataTemplate: BulkFillMetadataTemplateFieldsPreflightResponse['fields'][number]['metadata_template'];
	readonly variousInputs: boolean;
}) {
	return (
		<span className="flex grow place-content-between place-items-center gap-2">
			<span className="flex place-items-center gap-2">
				<span
					className="max-w-[20ch] truncate text-base-label-md text-base-neutral-800 md:max-w-[30ch] dark:text-base-neutral-100"
					title={props.customKey}
				>
					{props.customKey}
				</span>
				<Tooltip delay={400}>
					<TooltipTrigger slot={null} variant="tooltip">
						<Link
							href={`/metadata-templates/${props.metadataTemplate.metadata_template_container.pk}?version=${props.metadataTemplate.pk}`}
							target="_blank"
						>
							<BlocksIcon
								aria-hidden
								className="text-base-crystal-500 dark:text-base-crystal-300"
								size={18}
								strokeWidth={1.5}
							/>
						</Link>
					</TooltipTrigger>
					<TooltipContent arrow={false}>{props.metadataTemplate.metadata_template_container.name}</TooltipContent>
				</Tooltip>
			</span>
			{props.variousInputs ? (
				<Tooltip delay={400}>
					<TooltipTrigger
						aria-label="Various inputs"
						className="rounded-full bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100"
						slot={null}
						size="icon-xs"
						variant="unset"
					>
						<TextCursorInputIcon aria-hidden size={18} strokeWidth={1.5} />
					</TooltipTrigger>
					<TooltipContent arrow={false} variant="rich">
						<span className="text-base-label-md">Attention</span>
						<br />
						<br />
						This field has multiple filled-in values in various files. These values will be replaced when selected and
						confirmed.
						<br />
						<br />
						Affected fields will not be selected by default.
					</TooltipContent>
				</Tooltip>
			) : null}
		</span>
	);
}

export function BulkFillMetadataTemplateFieldsDialog(
	props: ModalContentProps & {
		readonly applyErrorMessage?: string;
		readonly data: BulkFillMetadataTemplateFieldsPreflightResponse;
		readonly isApplying?: boolean;
		onApply?(input: BulkFillMetadataTemplateFieldsSubmitPayload): Promise<unknown>;
		readonly selected: BulkFillMetadataTemplateFieldsEligibleDataset[];
	},
) {
	return (
		<ModalContent {...props} aria-label={BULK_FILL_METADATA_TEMPLATE_FIELDS_TITLE} className="sm:max-w-[536px]">
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<TextCursorInputIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">{BULK_FILL_METADATA_TEMPLATE_FIELDS_TITLE}</ModalTitle>
			</ModalHeader>
			<BulkFillMetadataTemplateFieldsFormContent
				applyErrorMessage={props.applyErrorMessage}
				data={props.data}
				isApplying={props.isApplying}
				onApply={props.onApply}
				selected={props.selected}
			/>
		</ModalContent>
	);
}

function BulkFillMetadataTemplateFieldsFormContent(props: {
	readonly applyErrorMessage?: string;
	readonly data: BulkFillMetadataTemplateFieldsPreflightResponse;
	readonly isApplying?: boolean;
	onApply?(input: BulkFillMetadataTemplateFieldsSubmitPayload): Promise<unknown>;
	readonly selected: BulkFillMetadataTemplateFieldsEligibleDataset[];
}) {
	const [fields, setFields] = useState<BulkFillMetadataTemplateFieldState[]>(() =>
		createInitialFieldState(props.data.fields),
	);
	const [validationMessages, setValidationMessages] = useState<Record<string, string>>({});
	const { formProps, submitButtonProps } = useDialogForm('bulk-fill-metadata-template-fields');

	useEffect(() => {
		setFields(createInitialFieldState(props.data.fields));
		setValidationMessages({});
	}, [props.data.fields]);

	const selectedFieldCount = fields.filter((field) => field.selected).length;
	const allSelected = fields.length > 0 && selectedFieldCount === fields.length;
	const someSelected = selectedFieldCount > 0 && selectedFieldCount < fields.length;

	async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!props.onApply || selectedFieldCount === 0) {
			return;
		}
		const nextValidationMessages = Object.fromEntries(
			fields
				.filter((field) => field.selected)
				.flatMap((field) => {
					const message = getMetadataChoiceWriteValidationMessage({
						config: field.config,
						fieldType: field.field_type,
						value: field.value,
					});
					return message ? [[field.pk, message] as const] : [];
				}),
		);
		setValidationMessages(nextValidationMessages);
		if (Object.keys(nextValidationMessages).length > 0) {
			return;
		}

		await props.onApply(
			trimMetadataPayload({
				targets: props.selected.map((dataset) => ({
					base_version_pk: dataset.base_version_pk,
					uploads_dataset_pk: dataset.pk,
				})),
				fields: fields
					.filter((field) => field.selected)
					.map((field) => ({
						metadata_template_field_pk: field.pk,
						value: field.value ?? null,
					})),
			}),
		);
	}

	return (
		<>
			<ModalBody className="p-0 pt-4">
				<Form {...formProps} onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="px-6">
						<Alert
							className="border border-base-crystal-300 font-normal text-base-neutral-900 dark:border-base-crystal-500 dark:text-base-neutral-40"
							variant="info"
						>
							The filled-in values will be applied to all selected files. Previous values will be overwritten.
						</Alert>
					</div>
					{props.applyErrorMessage ? (
						<div className="px-6">
							<Alert variant="error">
								<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
								{props.applyErrorMessage}
							</Alert>
						</div>
					) : null}

					<div>
						<div className="flex h-12 place-content-between border-b border-base-neutral-100 bg-base-neutral-60 px-6 dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
							<div className="flex grow place-content-between place-items-center gap-4">
								<Checkbox
									aria-label="Select all fields"
									isIndeterminate={someSelected}
									isSelected={allSelected}
									onChange={(isSelected) =>
										setFields((currentFields) =>
											currentFields.map((field) => ({
												...field,
												selected: isSelected,
											})),
										)
									}
								>
									Select all
								</Checkbox>
								<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									Total: {fields.length} field{fields.length === 1 ? '' : 's'}
								</span>
							</div>
						</div>

						<div className="flex flex-col gap-6 overflow-y-auto px-6 py-3">
							{fields.map((field, index) => (
								<div className="flex gap-4" key={field.pk}>
									<div className="mt-10 flex shrink-0">
										<Checkbox
											aria-label={`Select ${field.custom_key}`}
											isSelected={field.selected}
											onChange={(isSelected) =>
												setFields((currentFields) =>
													currentFields.map((currentField, currentIndex) =>
														currentIndex === index ? { ...currentField, selected: isSelected } : currentField,
													),
												)
											}
										/>
									</div>
									<MetadataTemplateFieldValueEditor
										configStrategy="preserve"
										className="**:data-[slot=label]:w-full"
										errorMessage={validationMessages[field.pk] ? { message: validationMessages[field.pk] } : undefined}
										fieldConfig={field.config}
										fieldType={field.field_type}
										isDisabled={false}
										label={
											<BulkFillMetadataTemplateFieldLabel
												customKey={field.custom_key}
												metadataTemplate={field.metadata_template}
												variousInputs={field.various_inputs}
											/>
										}
										onBlur={() => {}}
										onChange={(next) => {
											setValidationMessages((current) =>
												Object.fromEntries(Object.entries(current).filter(([key]) => key !== field.pk)),
											);
											setFields((currentFields) =>
												currentFields.map((currentField, currentIndex) =>
													currentIndex === index
														? {
																...mergeMetadataValueEditorChange(currentField, next),
																selected: currentField.selected,
															}
														: currentField,
												),
											);
										}}
										value={field.value}
									/>
								</div>
							))}
						</div>
					</div>
				</Form>
			</ModalBody>
			<ModalFooter hasBorder className="sm:place-content-between">
				<div className="hidden place-items-center gap-1 text-base-xs md:flex">
					<span
						className={cx(
							'rounded-2xl px-1 py-px',
							selectedFieldCount === 0 ? 'bg-base-lavender-200' : 'bg-base-lavender-200 dark:bg-base-lavender-700',
						)}
					>
						{selectedFieldCount}
					</span>
					selected
				</div>
				<div className="flex flex-col-reverse gap-2 sm:flex-row">
					<ModalClose variant="secondary-discreet">Cancel</ModalClose>
					<Button {...submitButtonProps} isDisabled={selectedFieldCount === 0 || props.isApplying} variant="filled">
						{props.isApplying ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
						{props.isApplying ? 'Applying metadata...' : 'Apply metadata'}
					</Button>
				</div>
			</ModalFooter>
		</>
	);
}

function BulkFillMetadataTemplateFieldsWarningContent(props: {
	readonly data: BulkFillMetadataTemplateFieldsPreflightResponse;
	onSkip(): void;
}) {
	const hasPendingUpgradeSkip = hasPendingTemplateUpgradeSkip(props.data);
	const hasDifferentDatasetTemplates = hasDifferentDatasetMetadataTemplatesWarning(props.data);
	const title = hasDifferentDatasetTemplates
		? hasPendingUpgradeSkip
			? 'The bulk fill-in is limited to eligible files and shared project or folder fields.'
			: 'The bulk fill-in is limited to shared project or folder fields.'
		: 'The bulk fill-in is limited to files without a pending metadata template upgrade.';
	const description = hasDifferentDatasetTemplates
		? hasPendingUpgradeSkip
			? 'Some selected files are waiting for metadata template upgrades. File-level fields are also hidden because not all remaining files share the same file-level metadata template.'
			: 'Not all selected files share the same file-level metadata template, so file-level fields cannot be filled together for this selection.'
		: 'Please perform the available metadata template upgrades or deselect all affected files and trigger the bulk fill-in action again.';

	return (
		<>
			<ModalBody className="flex flex-col place-items-center gap-6 py-8 text-center">
				<div className="flex place-items-center gap-3 text-base-tangerine-600 dark:text-base-tangerine-300">
					<FileStackIcon aria-hidden size={28} strokeWidth={1.5} />
					<NotepadTextDashedIcon aria-hidden size={28} strokeWidth={1.5} />
					<AlertCircleIcon aria-hidden size={28} strokeWidth={1.5} />
				</div>
				<div className="flex flex-col gap-4">
					<p className="text-base-xl text-base-neutral-900 dark:text-base-neutral-40">{title}</p>
					<div className="flex place-content-center place-items-center gap-1">
						<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">{description}</p>
						{hasPendingUpgradeSkip ? (
							<Tooltip delay={400}>
								<TooltipTrigger aria-label="Why are files affected?" size="icon-xs" variant="unset">
									<HelpCircleIcon aria-hidden size={18} strokeWidth={1.5} />
								</TooltipTrigger>
								<TooltipContent arrow={false} variant="plain">
									{getWarningHelpText(props.data.skip_reasons)}
								</TooltipContent>
							</Tooltip>
						) : null}
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				{props.data.skipped_uploads_datasets_count > 0 ? (
					<div className="hidden place-items-center gap-2 text-base-xs text-base-neutral-600 md:flex dark:text-base-neutral-300">
						<span className="rounded-2xl bg-base-neutral-700 px-1 py-px text-base-label-xs text-base-neutral-40 dark:bg-base-neutral-200 dark:text-base-neutral-900">
							{props.data.skipped_uploads_datasets_count}
						</span>
						files affected
					</div>
				) : null}
				<div className="flex gap-2">
					<Button onPress={props.onSkip} variant="secondary-discreet">
						{hasPendingUpgradeSkip ? 'Skip' : 'Continue'}
					</Button>
					<ModalClose variant="filled">Got it</ModalClose>
				</div>
			</ModalFooter>
		</>
	);
}

export function BulkFillMetadataTemplateFieldsFlow(props: {
	readonly folderUuid?: string;
	readonly isOpen: boolean;
	onOpenChange(isOpen: boolean): void;
	readonly selected: string[];
}) {
	const queryClient = useQueryClient();
	const exitBulkMode = useExitFilesBulkMode();
	const [preflightData, setPreflightData] = useState<BulkFillMetadataTemplateFieldsPreflightResponse | null>(null);
	const [showWarningDialog, setShowWarningDialog] = useState(false);
	const wasOpenRef = useRef(props.isOpen);

	const eligibleDatasets = useMemo(() => preflightData?.eligible_uploads_datasets ?? [], [preflightData]);

	const preflightMutation = useMutation({
		mutationFn: bulkFillMetadataTemplateFieldsPreflight,
		onSuccess(data) {
			setPreflightData(data);
			setShowWarningDialog(hasPendingTemplateUpgradeSkip(data) || hasDifferentDatasetMetadataTemplatesWarning(data));
		},
		onError(error) {
			logger.error(LogCategory.MetadataTemplate, 'Bulk fill metadata template fields preflight failed', {
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	const applyMutation = useMutation({
		mutationFn: bulkFillMetadataTemplateFieldsApply,
		async onSuccess(data) {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
				}),
				props.folderUuid
					? queryClient.invalidateQueries({
							queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
								params: { path: { id: props.folderUuid } },
							}).queryKey,
						})
					: Promise.resolve(),
			]);

			await exitBulkMode();

			globalToastQueue.add(
				{
					message: `Metadata template fields applied to ${data.updated_uploads_datasets_count} file${data.updated_uploads_datasets_count === 1 ? '' : 's'}.`,
					type: ToastType.Success,
				},
				{ timeout: 5_000 },
			);

			setShowWarningDialog(false);
			setPreflightData(null);
			props.onOpenChange(false);
		},
		onError(error) {
			logger.error(LogCategory.MetadataTemplate, 'Bulk fill metadata template fields apply failed', {
				error: error instanceof Error ? error.message : String(error),
			});
		},
	});

	useEffect(() => {
		if (wasOpenRef.current && !props.isOpen) {
			setPreflightData(null);
			setShowWarningDialog(false);
			preflightMutation.reset();
			applyMutation.reset();
		}

		wasOpenRef.current = props.isOpen;
	}, [applyMutation, preflightMutation, props.isOpen]);

	useEffect(() => {
		if (!props.isOpen) {
			return;
		}

		if (!props.selected.length || preflightMutation.isPending || preflightData) {
			return;
		}

		preflightMutation.mutate({ uploads_datasets: props.selected });
	}, [preflightData, preflightMutation, props.isOpen, props.selected]);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setShowWarningDialog(false);
			setPreflightData(null);
			preflightMutation.reset();
			applyMutation.reset();
		}

		props.onOpenChange(isOpen);
	}

	if (!props.isOpen) {
		return null;
	}

	return (
		<ModalContent
			aria-label={BULK_FILL_METADATA_TEMPLATE_FIELDS_TITLE}
			className="max-sm:flex max-sm:grow max-sm:rounded-none max-sm:[--visual-viewport-vertical-padding:0px]"
			overlay={{ className: 'max-sm:p-0 max-sm:flex max-sm:flex-col' }}
			isOpen
			closeButton={false}
			onOpenChange={handleOpenChange}
		>
			<ModalHeader className="flex flex-row place-items-center gap-2 text-base-xl" hasBorder>
				<DialogCloseIcon className="max-sm:relative max-sm:inset-0" isDismissable />
				<TextCursorInputIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">{BULK_FILL_METADATA_TEMPLATE_FIELDS_TITLE}</ModalTitle>
			</ModalHeader>
			{preflightMutation.isPending || (!preflightData && !preflightMutation.error) ? (
				<>
					<ModalBody className="py-6">
						<div className="flex place-items-center gap-2 text-base-neutral-600 dark:text-base-neutral-300">
							<Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} />
							Loading bulk fill options...
						</div>
					</ModalBody>
					<ModalFooter hasBorder>
						<ModalClose variant="secondary-discreet">Cancel</ModalClose>
					</ModalFooter>
				</>
			) : preflightMutation.error ? (
				<>
					<ModalBody className="py-6">
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							{preflightMutation.error.message}
						</Alert>
					</ModalBody>
					<ModalFooter hasBorder>
						<ModalClose variant="secondary-discreet">Close</ModalClose>
					</ModalFooter>
				</>
			) : preflightData ? (
				showWarningDialog ? (
					<BulkFillMetadataTemplateFieldsWarningContent
						data={preflightData}
						onSkip={() => setShowWarningDialog(false)}
					/>
				) : (
					<BulkFillMetadataTemplateFieldsFormContent
						applyErrorMessage={applyMutation.error?.message}
						data={preflightData}
						isApplying={applyMutation.isPending}
						onApply={applyMutation.mutateAsync}
						selected={eligibleDatasets}
					/>
				)
			) : null}
		</ModalContent>
	);
}
