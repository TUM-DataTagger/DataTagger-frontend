import type { Metadata } from 'next/types';
import { ElabftwSettingsForm } from './ElabftwSettingsForm';

export const metadata: Metadata = {
	title: 'eLabFTW connection',
};

export default function Page() {
	return (
		<div className="mx-auto flex w-full max-w-2xl grow flex-col gap-6 px-4 py-12">
			<div className="flex flex-col gap-2">
				<h1 className="text-base-heading-lg">eLabFTW connection</h1>
				<p className="text-base-neutral-600 dark:text-base-neutral-300">
					Connect your eLabFTW account to link experiments to folders, subfolders and files. Your API key is stored on
					the DataTagger server and never shown again. Create a key in eLabFTW under{' '}
					<span className="text-base-label-md">User panel → API keys</span>; read-only access is enough.
				</p>
			</div>
			<ElabftwSettingsForm />
		</div>
	);
}
