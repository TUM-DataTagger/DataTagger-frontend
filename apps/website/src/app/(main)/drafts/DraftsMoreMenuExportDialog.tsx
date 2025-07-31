'use client';

import { FolderArchiveIcon } from 'lucide-react';
import type { ModalOverlayProps } from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
// import { useEnv } from '@/contexts/EnvContext';

export function DraftsMoreMenuExportDialog({
	versionUuid,
	filename,
	...props
}: ModalOverlayProps & {
	readonly filename: string;
	readonly versionUuid: string;
}) {
	// const env = useEnv();

	// const downloadUrl = `${env.BASE_API_URL}/api/v1/uploads-version/${versionUuid}/download/`;

	return (
		<ModalContent {...props} aria-label={`Export all available data from "${filename}" to a zip file`}>
			<ModalHeader aria-hidden />
			<ModalBody>
				<div className="flex flex-col place-items-center gap-4">
					<FolderArchiveIcon aria-hidden size={24} strokeWidth={1.5} />
					<span className="text-base-sm text-center break-all">
						Export all available data from "{filename}" to a zip file (e.g. file, file metadata, additional metadata).
					</span>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button className="w-full" type="submit" variant="secondary-filled">
					Export
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}
