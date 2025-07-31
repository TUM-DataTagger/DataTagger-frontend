import { FilePlusIcon } from 'lucide-react';
import { UploadTrigger } from '@/components/UploadTrigger';
import { Button } from '@/components/ui/Button';

export function DraftsViewEmpty() {
	return (
		<div className="global-dropzone-border flex h-[248px] flex-col place-content-center rounded-xl p-px">
			<div className="bg-base-lavender-100/64 text-base-lavender-600 dark:bg-base-lavender-800/64 dark:text-base-lavender-200 h-full w-full place-content-center place-items-center rounded-xl text-center">
				<div className="flex flex-col gap-3">
					<span className="text-base-xl">Private space is empty</span>
					<div className="hidden place-content-center place-items-center gap-2 md:flex">
						<span>Drag and drop files to upload them or</span>
						<UploadTrigger>
							<Button isDark size="sm" variant="filled">
								Select files
							</Button>
						</UploadTrigger>
					</div>

					<div className="flex flex-col place-content-center place-items-center gap-4 md:hidden">
						<span>Select files for use within the tool.</span>
						<UploadTrigger>
							<Button variant="filled">
								<FilePlusIcon aria-hidden size={18} strokeWidth={1.5} />
								Upload files
							</Button>
						</UploadTrigger>
					</div>
				</div>
			</div>
		</div>
	);
}
