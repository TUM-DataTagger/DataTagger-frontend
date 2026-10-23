import type { Metadata } from 'next/types';
import { ExperimentsView } from './ExperimentsView';

export const metadata: Metadata = {
	title: 'Experiments',
};

export default function Page() {
	return (
		<div className="flex w-full grow flex-col gap-6 px-4 py-12 md:px-8 xl:px-[132px]">
			<div className="flex flex-col gap-2">
				<h1 className="text-base-heading-lg">Experiments</h1>
				<p className="max-w-3xl text-base-neutral-600 dark:text-base-neutral-300">
					All eLabFTW experiments linked to folders, subfolders or files you have access to. Select experiments to
					download their data for evaluation: one directory per experiment with all linked files in their folder
					structure, plus a metadata file describing the experiment, folders, subfolders and files.
				</p>
			</div>
			<ExperimentsView />
		</div>
	);
}
