'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
	ModalBody,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	type ModalContentProps,
} from '@/components/ui/Modal';
import { cx } from '@/styles/cva';

const MAX_GUIDANCE_CHARACTERS = 500;

type MetadataFieldGuidanceDialogProps = {
	readonly initialValue: string;
	readonly isEditMode: boolean;
	onRemove(): void;
	onSave(value: string): void;
} & Pick<ModalContentProps, 'isOpen' | 'onOpenChange'>;

export function MetadataTemplateFieldGuidanceDialog({
	initialValue,
	isOpen,
	isEditMode,
	onRemove,
	onSave,
	...props
}: MetadataFieldGuidanceDialogProps) {
	const [draftValue, setDraftValue] = useState(initialValue);
	const canSave = Boolean(draftValue.trim().length);

	useEffect(() => {
		if (isOpen) {
			setDraftValue(initialValue);
		}
	}, [initialValue, isOpen]);

	return (
		<ModalContent {...props} aria-label={isEditMode ? 'Edit fill-in guidance' : 'Add fill-in guidance'} isOpen={isOpen}>
			<ModalHeader>
				<ModalTitle className="text-base-xl">
					{isEditMode ? 'Edit fill-in guidance' : 'Add fill-in guidance'}
				</ModalTitle>
			</ModalHeader>
			<ModalBody className="gap-1">
				<textarea
					aria-label="Fill-in guidance"
					autoFocus
					className={cx(
						'outline-offset-2 outline-base-lavender-400 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]',
						'focus-within:outline-2 focus:outline-2 focus-visible:outline-2',
						'relative block h-48 w-full appearance-none rounded-sm border px-3 py-2.5 transition duration-200 ease-out forced-colors:outline-[Highlight]',
						'text-base-lg text-base-neutral-900 placeholder:text-base-neutral-400 sm:text-base-md dark:text-base-neutral-40 dark:placeholder:text-base-neutral-500',
						'border-base-neutral-300 bg-base-neutral-0 dark:border-base-neutral-500 dark:bg-base-neutral-800',
						'hover:border-base-neutral-200 dark:hover:border-base-neutral-600',
						'focus:border-base-neutral-200 dark:focus:border-base-neutral-600',
						'disabled:opacity-38 in-disabled:opacity-38 forced-colors:disabled:border forced-colors:disabled:border-[GrayText] forced-colors:in-disabled:border forced-colors:in-disabled:border-[GrayText]',
					)}
					maxLength={MAX_GUIDANCE_CHARACTERS}
					onChange={(event) => setDraftValue(event.target.value)}
					placeholder="How the field should be filled in"
					value={draftValue}
				/>
				<span className="text-end text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					{draftValue.length} / {MAX_GUIDANCE_CHARACTERS} characters
				</span>
			</ModalBody>
			<ModalFooter className={isEditMode ? 'sm:place-content-between' : undefined}>
				{isEditMode ? (
					<Button onPress={onRemove} type="button" variant="outline">
						Remove guidance
					</Button>
				) : null}
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:place-items-center">
					<ModalClose type="button" variant="secondary-discreet">
						Cancel
					</ModalClose>
					<Button isDisabled={!canSave} onPress={() => onSave(draftValue)} type="button" variant="filled">
						{isEditMode ? 'Save changes' : 'Apply'}
					</Button>
				</div>
			</ModalFooter>
		</ModalContent>
	);
}
