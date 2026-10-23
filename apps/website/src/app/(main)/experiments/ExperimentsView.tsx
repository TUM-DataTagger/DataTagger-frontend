'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLinkIcon, FlaskConicalIcon, FolderArchiveIcon, Loader2Icon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ExportJobDialog } from '@/components/ExportJobDialog';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input, InputGroup } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { cx } from '@/styles/cva';
import { $api } from '@/util/clientFetch';
import { EXPORT_TYPES } from '@/util/exportJobs';
import type { components } from '@/util/openapiSchema';

type LinkedExperiment = components['schemas']['LinkedExperiment'];
type LinkedExperimentPlace = components['schemas']['LinkedExperimentPlace'];

function experimentKey(experiment: LinkedExperiment) {
	return `${experiment.elabftw_url}#${experiment.experiment_id}`;
}

function placeHref(place: LinkedExperimentPlace) {
	if (!place.folder_id || !place.project_id) {
		return place.target_type === 'dataset' ? `/drafts/${place.target_id}` : '/drafts';
	}

	const folderHref = `/projects/${place.project_id}/folders/${place.folder_id}`;

	if (place.target_type === 'dataset') {
		return `${folderHref}/files/${place.target_id}`;
	}

	return place.subfolder_id ? `${folderHref}?subfolder=${place.subfolder_id}` : folderHref;
}

const placeLabels: Readonly<Record<LinkedExperimentPlace['target_type'], string>> = {
	folder: 'Folder',
	subfolder: 'Subfolder',
	dataset: 'File',
};

export function ExperimentsView() {
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
	const [isExportOpen, setIsExportOpen] = useState(false);

	const { data: experiments, isPending } = useQuery($api.queryOptions('get', '/api/v1/experiment-link/experiments/'));

	const query = search.trim().toLowerCase();
	const visibleExperiments = (experiments ?? []).filter(
		(experiment) =>
			!query ||
			experiment.title.toLowerCase().includes(query) ||
			`#${experiment.experiment_id}`.includes(query) ||
			experiment.places.some((place) => place.path.toLowerCase().includes(query)),
	);
	const selectedExperiments = (experiments ?? []).filter((experiment) => selected.has(experimentKey(experiment)));
	const selectedFilesCount = selectedExperiments.reduce((sum, experiment) => sum + experiment.files_count, 0);
	const allVisibleSelected =
		visibleExperiments.length > 0 && visibleExperiments.every((experiment) => selected.has(experimentKey(experiment)));

	const toggle = (key: string, isSelected: boolean) =>
		setSelected((current) => {
			const next = new Set(current);
			if (isSelected) {
				next.add(key);
			} else {
				next.delete(key);
			}

			return next;
		});

	if (isPending) {
		return <Loader2Icon aria-label="Loading experiments" className="animate-spin" size={24} strokeWidth={1.5} />;
	}

	if (!experiments?.length) {
		return (
			<div className="flex flex-col place-items-center gap-3 rounded-2xl bg-base-lavender-100/38 px-6 py-16 text-center dark:bg-base-lavender-800/38">
				<FlaskConicalIcon aria-hidden size={32} strokeWidth={1.5} />
				<span className="text-base-xl">No linked experiments yet</span>
				<span className="max-w-xl text-base-neutral-600 dark:text-base-neutral-300">
					Link eLabFTW experiments to folders, subfolders or files with “Link experiment” on their pages. They will
					appear here for evaluation downloads.
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="sticky top-0 z-10 flex flex-wrap place-content-between place-items-center gap-4 border-b border-base-neutral-100 bg-base-neutral-0 py-3 dark:border-base-neutral-700 dark:bg-base-neutral-800">
				<div className="flex flex-wrap place-items-center gap-4">
					<Checkbox
						isIndeterminate={selected.size > 0 && !allVisibleSelected}
						isSelected={allVisibleSelected}
						onChange={(isSelected) => {
							for (const experiment of visibleExperiments) {
								toggle(experimentKey(experiment), isSelected);
							}
						}}
					>
						Select all
					</Checkbox>
					<TextField aria-label="Filter experiments" className="md:w-72" onChange={setSearch} value={search}>
						<InputGroup>
							<SearchIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
							<Input placeholder="Filter by title, ID or place" />
						</InputGroup>
					</TextField>
				</div>
				<div className="flex place-items-center gap-4">
					<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
						{selected.size
							? `${selected.size} selected · ${selectedFilesCount} ${selectedFilesCount === 1 ? 'file' : 'files'}`
							: 'Nothing selected'}
					</span>
					<Button isDisabled={!selected.size} onPress={() => setIsExportOpen(true)} variant="filled">
						<FolderArchiveIcon aria-hidden size={18} strokeWidth={1.5} /> Download for evaluation
					</Button>
				</div>
			</div>

			<ul aria-label="Linked experiments" className="flex flex-col gap-2">
				{visibleExperiments.map((experiment) => {
					const key = experimentKey(experiment);
					const isSelected = selected.has(key);

					return (
						<li
							className={cx(
								'flex flex-col gap-3 rounded-lg border px-4 py-3 md:flex-row md:place-items-start',
								isSelected
									? 'border-base-lavender-400 bg-base-lavender-100/38 dark:border-base-lavender-500 dark:bg-base-lavender-900/38'
									: 'border-base-neutral-100 dark:border-base-neutral-700',
							)}
							key={key}
						>
							<Checkbox
								aria-label={`Select experiment #${experiment.experiment_id}`}
								className="pt-0.5"
								isSelected={isSelected}
								onChange={(value) => toggle(key, value)}
							/>
							<div className="flex min-w-0 grow flex-col gap-2">
								<div className="flex flex-wrap place-items-baseline gap-x-3 gap-y-1">
									<span className="text-base-label-md">{experiment.title || 'Untitled experiment'}</span>
									<a
										className="flex place-items-center gap-1 text-base-sm text-base-lavender-600 hover:underline dark:text-base-lavender-400"
										href={experiment.experiment_url}
										rel="noreferrer noopener external"
										target="_blank"
									>
										#{experiment.experiment_id} in eLabFTW
										<ExternalLinkIcon aria-hidden size={14} strokeWidth={1.5} />
									</a>
								</div>
								<ul aria-label="Linked to" className="flex flex-col gap-1">
									{experiment.places.map((place) => (
										<li className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300" key={place.link_id}>
											{placeLabels[place.target_type]}:{' '}
											<Link
												className="text-base-neutral-900 hover:underline dark:text-base-neutral-40"
												href={placeHref(place)}
											>
												{place.path}
											</Link>
										</li>
									))}
								</ul>
							</div>
							<span className="shrink-0 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
								{experiment.files_count} {experiment.files_count === 1 ? 'file' : 'files'}
							</span>
						</li>
					);
				})}
			</ul>

			{visibleExperiments.length === 0 ? (
				<p className="text-base-neutral-600 dark:text-base-neutral-300">No experiments match the filter.</p>
			) : null}

			<ExportJobDialog
				description={
					<>
						Download the data of {selected.size} {selected.size === 1 ? 'experiment' : 'experiments'} (
						{selectedFilesCount} {selectedFilesCount === 1 ? 'file' : 'files'}) as a zip file: one directory per
						experiment with the files in their folder structure. With metadata, each directory also contains a metadata
						file with the experiment from eLabFTW and the metadata of all folders, subfolders and files.
					</>
				}
				exportType={EXPORT_TYPES.ExperimentLink}
				isOpen={isExportOpen}
				onOpenChange={setIsExportOpen}
				title="Download for evaluation"
				uuids={selectedExperiments.flatMap((experiment) => experiment.link_ids)}
			/>
		</div>
	);
}
