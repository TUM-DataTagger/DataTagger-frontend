import { DraftsUploadDropzone } from '@/components/upload-assistant/DraftsUploadDropzone';

export function DraftsViewEmpty() {
	return <DraftsUploadDropzone className="h-[248px]" showBorderOnMobile title="Private space is empty" />;
}
