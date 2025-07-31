'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';
import Link from 'next/link';
import { useMediaQuery } from 'usehooks-ts';
import { MetadataValue } from '@/components/Metadata';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { useMetadataTemplatePermissions } from '@/hooks/useMetadataTemplatePermissions';
import { buttonStyles } from '@/styles/ui/button';
import { $api } from '@/util/clientFetch';

export function MetadataTemplateMetadata(props: { readonly metadataTemplateUuid: string }) {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const { data: metadataTemplateFieldsData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/metadata-template-field/', {
			params: { query: { metadata_template: props.metadataTemplateUuid } },
		}),
	);

	const { isProjectMetadataTemplateAdmin, isFolderAdmin, isGlobalMetadataTemplateAdmin } =
		useMetadataTemplatePermissions({
			metadataTemplateUuid: props.metadataTemplateUuid,
		});

	return (
		<Accordion
			className="flex flex-col gap-6"
			defaultValue={[metadataTemplateFieldsData.results?.length ? 'metadata-template-metadata' : '']}
			disabled={!metadataTemplateFieldsData.results?.length}
			type="multiple"
		>
			<AccordionItem className="relative" value="metadata-template-metadata">
				{(!isProjectMetadataTemplateAdmin && !isFolderAdmin && !isGlobalMetadataTemplateAdmin) || isMobile ? null : (
					<Link
						className={buttonStyles({
							variant: 'filled',
							isDark: true,
							size: 'sm',
							className: 'absolute top-[13px] right-16',
						})}
						href={`/metadata-templates/${props.metadataTemplateUuid}/edit-metadata-fields`}
					>
						Edit metadata fields
					</Link>
				)}
				<AccordionTrigger
					append={
						<ChevronDownIcon
							aria-hidden
							className="duration-200 group-data-[state=open]:rotate-180"
							size={24}
							strokeWidth={1.5}
						/>
					}
					className="border-base-neutral-100 text-base-label-md dark:border-base-neutral-700 rounded-lg border px-6 py-4 text-[unset] hover:text-[unset] focus-visible:text-[unset] data-[state=open]:rounded-b-none dark:text-[unset] dark:focus-visible:text-[unset]"
				>
					Metadata template fields
				</AccordionTrigger>
				<AccordionContent className="bg-base-neutral-40 dark:bg-base-neutral-700/40 flex flex-col gap-4 rounded-b-lg border border-t-0 px-6 py-4">
					{metadataTemplateFieldsData.results?.map((metadata) => (
						<div className="flex flex-col gap-1" key={metadata.pk}>
							<span className="text-base-label-md text-base-neutral-500 dark:text-base-neutral-400 break-all">
								{metadata.custom_key}
							</span>
							<MetadataValue field={metadata} />
						</div>
					)) ?? null}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
