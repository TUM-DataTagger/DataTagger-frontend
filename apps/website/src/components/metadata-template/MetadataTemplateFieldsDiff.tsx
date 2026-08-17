'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';
import { MetadataValue } from '@/components/Metadata';
import { Separator } from '@/components/ui/Separator';
import { $api } from '@/util/clientFetch';
import { hasMetadataFieldChanged, scrubMetadataField } from '@/util/metadataDiff';

export function MetadataTemplateFieldsDiff(props: { readonly compareId: string; readonly selectedId: string }) {
	const { data } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template/{id}/diff/', {
			params: {
				path: { id: props.selectedId },
				query: { compare: props.compareId },
			},
		}),
	);

	const fields = data.fields ?? [];

	const added = fields.filter((item) => item.old === null && item.new !== null);
	const removed = fields.filter((item) => item.old !== null && item.new === null);
	const changed = fields.filter(
		(item) => item.old !== null && item.new !== null && hasMetadataFieldChanged(item.old, item.new),
	);

	if (!added.length && !removed.length && !changed.length) {
		return (
			<span className="flex place-content-between place-items-center gap-2 px-4 text-base-neutral-600 dark:text-base-neutral-300">
				No differences
			</span>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{added.length ? (
				<section className="flex flex-col gap-2">
					<header className="text-base-label-md text-green-700 dark:text-green-400">Added ({added.length})</header>
					<div className="flex flex-col gap-3">
						{added.map((item, idx) => {
							const nextField = scrubMetadataField(item.new!);
							return (
								<div className="flex flex-col gap-1" key={`added-${idx}`}>
									<span className="text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
										{nextField.custom_key}
									</span>
									<MetadataValue field={nextField} />
								</div>
							);
						})}
					</div>
				</section>
			) : null}

			{removed.length ? (
				<>
					<Separator className="m-0" />
					<section className="flex flex-col gap-2">
						<header className="text-base-label-md text-red-700 dark:text-red-400">Removed ({removed.length})</header>
						<div className="flex flex-col gap-3">
							{removed.map((item, idx) => {
								const prevField = scrubMetadataField(item.old!);
								return (
									<div className="flex flex-col gap-1" key={`removed-${idx}`}>
										<span className="text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
											{prevField.custom_key}
										</span>
										<MetadataValue field={prevField} />
									</div>
								);
							})}
						</div>
					</section>
				</>
			) : null}

			{changed.length ? (
				<>
					<Separator className="m-0" />
					<section className="flex flex-col gap-2">
						<header className="text-base-label-md text-amber-700 dark:text-amber-400">
							Changed ({changed.length})
						</header>
						<div className="flex flex-col gap-4">
							{changed.map((item, idx) => {
								const prevField = scrubMetadataField(item.old!);
								const nextField = scrubMetadataField(item.new!);
								return (
									<div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1fr] md:gap-4" key={`changed-${idx}`}>
										<div className="flex flex-col gap-1">
											<span className="text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
												{prevField.custom_key}
											</span>
											<MetadataValue field={prevField} />
										</div>
										<div className="place-self-center text-base-neutral-400 dark:text-base-neutral-500">
											<ArrowRightIcon aria-hidden size={18} strokeWidth={1.5} />
										</div>
										<div className="flex flex-col gap-1">
											<span className="text-base-label-md break-all text-base-neutral-600 dark:text-base-neutral-300">
												{nextField.custom_key}
											</span>
											<MetadataValue field={nextField} />
										</div>
									</div>
								);
							})}
						</div>
					</section>
				</>
			) : null}
		</div>
	);
}
