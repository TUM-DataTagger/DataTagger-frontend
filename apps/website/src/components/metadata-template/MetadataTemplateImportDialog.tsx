'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, FileInputIcon, FolderInputIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import type { MetadataTemplateCreateScope } from '@/components/metadata-template/create/metadataTemplateCreateScope';
import { resolveMetadataTemplateCreateScope } from '@/components/metadata-template/create/metadataTemplateCreateScope';
import { Alert } from '@/components/ui/Alert';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { Form, useDialogForm } from '@/components/ui/Form';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { buttonStyles } from '@/styles/ui/button';
import { openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

type MetadataTemplateImportDialogProps = ModalOverlayProps & {
	readonly scope: MetadataTemplateCreateScope;
};

export function MetadataTemplateImportDialog({ scope, ...props }: MetadataTemplateImportDialogProps) {
	const inputId = `metadata-template-import-${useId().replaceAll(':', '')}`;
	const queryClient = useQueryClient();
	const resolvedScope = resolveMetadataTemplateCreateScope(scope);
	const [file, setFile] = useState<File | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { formProps, submitButtonProps } = useDialogForm('metadata-template-import');

	const reset = () => {
		setFile(null);
		setErrorMessage(null);
	};

	useEffect(() => {
		if (!props.isOpen) {
			reset();
		}
	}, [props.isOpen]);

	const importMutation = useMutation({
		mutationFn: async (selectedFile: File) => {
			const formData = new FormData();
			formData.append('file', selectedFile);

			if (resolvedScope.assignedToContentType && resolvedScope.assignedToObjectId) {
				formData.append('assigned_to_content_type', resolvedScope.assignedToContentType);
				formData.append('assigned_to_object_id', resolvedScope.assignedToObjectId);
			}

			const { data, error, response } = await openAPIClient.POST('/api/v1/metadata-template-container/import/', {
				body: formData as unknown as components['schemas']['MetadataTemplateContainerImportActionRequest'],
			});

			if (error || !data) {
				throw new Error(formatErrorMessage(error, response));
			}

			return data;
		},
		async onSuccess(container) {
			await resolvedScope.invalidateQueries(queryClient);
			props.onOpenChange?.(false);
			reset();
			globalToastQueue.add(
				{ message: `Imported metadata template “${container.name}”.`, type: ToastType.Success },
				{ timeout: 5_000 },
			);
		},
		onError(error) {
			setErrorMessage(error instanceof Error ? error.message : 'Metadata template could not be imported.');
		},
	});

	const handleFileChange = (selectedFile: File | undefined) => {
		if (!selectedFile) {
			setFile(null);
			return;
		}

		const isJson = selectedFile.name.toLowerCase().endsWith('.json') && selectedFile.type !== 'application/zip';
		if (!isJson) {
			setFile(null);
			setErrorMessage('Select one JSON file. ZIP files are not supported.');
			return;
		}

		setFile(selectedFile);
		setErrorMessage(null);
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			reset();
		}
		props.onOpenChange?.(isOpen);
	};

	return (
		<ModalContent {...props} aria-label="Import metadata template" onOpenChange={handleOpenChange}>
			<ModalHeader className="flex flex-row place-items-center gap-3 text-base-xl">
				<FolderInputIcon aria-hidden size={24} strokeWidth={1.5} />
				<ModalTitle className="text-base-xl">Import metadata template</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Form
					{...formProps}
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						if (importMutation.isPending) {
							return;
						}
						if (!file) {
							setErrorMessage('Select one JSON file to import.');
							return;
						}
						importMutation.mutate(file);
					}}
				>
					<p>Select one metadata template JSON file. The file is imported directly without editing.</p>
					{errorMessage ? (
						<Alert>
							<AlertCircleIcon aria-hidden className="shrink-0" size={20} strokeWidth={1.5} />
							{errorMessage}
						</Alert>
					) : null}
					<div className="flex flex-col gap-4">
						<input
							accept="application/json,.json"
							aria-label="Metadata template JSON file"
							className="sr-only"
							disabled={importMutation.isPending}
							id={inputId}
							onChange={(event) => handleFileChange(event.currentTarget.files?.[0])}
							type="file"
						/>
						<div className="flex flex-wrap place-items-center gap-y-2">
							<label
								className={buttonStyles({
									variant: file ? 'outline' : 'secondary-filled',
									className: 'place-self-start',
								})}
								htmlFor={inputId}
							>
								<FileInputIcon aria-hidden size={18} strokeWidth={1.5} />
								{file ? 'Choose another file' : 'Select JSON file'}
							</label>
							<ul className="list-disc pl-6 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								<li>Only one .json file is supported</li>
								<li>ZIP files cannot be imported</li>
							</ul>
						</div>
						{file ? (
							<div className="rounded-lg border border-base-neutral-100 bg-base-neutral-60 px-4 py-3 text-base-sm break-all dark:border-base-neutral-700 dark:bg-base-neutral-700/40">
								{file.name}
							</div>
						) : null}
					</div>
				</Form>
			</ModalBody>
			<ModalFooter>
				<ModalClose isDisabled={importMutation.isPending} variant="secondary-discreet">
					Cancel
				</ModalClose>
				<Button {...submitButtonProps} isDisabled={!file || importMutation.isPending} variant="filled">
					<FolderInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
					{importMutation.isPending ? 'Importing...' : 'Import'}
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

export function MetadataTemplateImportButton({
	scope,
	...props
}: ButtonProps & { readonly scope: MetadataTemplateCreateScope }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button {...props} onPress={() => setIsOpen(true)}>
				<FolderInputIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
				Import
			</Button>
			<MetadataTemplateImportDialog isOpen={isOpen} onOpenChange={setIsOpen} scope={scope} />
		</>
	);
}
