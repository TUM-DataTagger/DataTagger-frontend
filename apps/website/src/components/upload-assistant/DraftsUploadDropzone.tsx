'use client';

import type { DropEvent } from '@react-types/shared';
import { FilePlusIcon } from 'lucide-react';
import { DropZone } from 'react-aria-components';
import { useMediaQuery } from 'usehooks-ts';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';
import type { UploadOrigin } from '@/uploads/types';
import { useUploadIntent } from '@/uploads/useUploadIntent';

type DraftsUploadDropzoneProps = {
	readonly className?: string | undefined;
	readonly hidden?: boolean | undefined;
	readonly origin?: UploadOrigin | undefined;
	readonly showBorderOnMobile?: boolean | undefined;
	readonly title?: string | undefined;
};

export function DraftsUploadDropzone({
	className,
	hidden,
	origin,
	showBorderOnMobile = false,
	title,
}: DraftsUploadDropzoneProps) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const { startDroppedCreateUploads } = useUploadIntent();

	const onDrop = async (event: DropEvent) => {
		await startDroppedCreateUploads({
			destination: { kind: 'draft' },
			items: event.items,
			origin,
		});
	};

	return (
		<DropZone
			aria-label="Upload files to My draft files"
			className={cx(
				'flex flex-col place-content-center rounded-xl p-px print:hidden',
				className,
				(!isMobile || showBorderOnMobile) && 'global-dropzone-border',
				hidden && 'hidden',
			)}
			onDrop={onDrop}
		>
			<div className="h-full w-full place-content-center place-items-center rounded-xl bg-base-lavender-100/64 text-center text-base-lavender-600 dark:bg-base-lavender-800/64 dark:text-base-lavender-200">
				<div className="flex flex-col gap-3">
					{title ? <span className="text-base-xl">{title}</span> : null}
					{isMobile ? (
						<div className="flex flex-col place-content-center place-items-center gap-4">
							<span>Select files for use within the tool.</span>
							<UploadTrigger origin={origin}>
								<Button variant="filled">
									<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
									Upload files
								</Button>
							</UploadTrigger>
						</div>
					) : (
						<div className={cx('flex place-content-center place-items-center gap-2', !title && 'flex-col')}>
							<span>Drag and drop files to upload them or</span>
							<UploadTrigger origin={origin}>
								<Button isDark size="sm" variant="filled">
									Select files
								</Button>
							</UploadTrigger>
							<UploadTrigger acceptDirectory origin={origin}>
								<Button isDark size="sm" variant="filled">
									Select folder
								</Button>
							</UploadTrigger>
						</div>
					)}
				</div>
			</div>
		</DropZone>
	);
}
