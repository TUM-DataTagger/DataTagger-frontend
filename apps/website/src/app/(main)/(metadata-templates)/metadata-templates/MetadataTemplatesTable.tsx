'use client';

import { format } from '@formkit/tempo';
import { Wand2Icon } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import type { Selection } from 'react-aria-components';
import { MetadataTemplateContainerBadge } from '@/components/metadata-template/MetadataTemplateContainer';
import { Link } from '@/components/ui/Link';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@/components/ui/Table';
import { buttonStyles } from '@/styles/ui/button';
import type { components } from '@/util/openapiSchema';
import { getSelectionStringValues } from '@/util/selection';
import { MetadataTemplatesCreateTable } from './MetadataTemplatesCreateTable';
import { metadataTemplateBulkQueryState } from './metadataTemplateBulkQueryState';
// import { ProjectsMoreMenu } from './ProjectsMoreMenu';

type MetadataTemplateContainer = components['schemas']['MetadataTemplateContainer'];

export function MetadataTemplatesTable(props: { readonly data?: MetadataTemplateContainer[] | undefined }) {
	const [queryStates, setQueryStates] = useQueryStates(metadataTemplateBulkQueryState);
	const handleSelectionChange = async (selectedKeys: Selection) => {
		const newSelected = getSelectionStringValues(
			selectedKeys,
			props.data?.map((item) => item.pk),
		);
		await setQueryStates({ selected: newSelected.length ? newSelected : [] });
	};

	return (
		<div className="flex flex-col">
			<MetadataTemplatesCreateTable
				className="border-0 border-b border-base-neutral-100 dark:border-base-neutral-700"
				href="/metadata-templates/create"
				isDisabled={queryStates.bulk_edit}
			/>
			<Table
				aria-label="Metadata templates"
				onSelectionChange={handleSelectionChange}
				selectedKeys={queryStates.selected}
				selectionMode={queryStates.bulk_edit ? 'multiple' : 'none'}
			>
				<TableHeader className="hidden">
					<TableColumn id="name" isRowHeader style={{ width: '300px' }}>
						Name
					</TableColumn>
					<TableColumn id="badge" style={{ width: '200px' }}>
						Badge
					</TableColumn>
					<TableColumn id="created_info" style={{ width: '300px' }}>
						Created by / Created at
					</TableColumn>
					<TableColumn id="actions" style={{ width: '50px' }}>
						Actions
					</TableColumn>
				</TableHeader>
				<TableBody dependencies={[queryStates.bulk_edit]} items={props.data ?? []}>
					{(item) => (
						<TableRow href={`/metadata-templates/${item.pk}`} id={item.pk}>
							<TableCell style={{ width: '300px' }} textValue={item.name}>
								{queryStates.bulk_edit ? (
									<span className="max-w-[30ch] truncate" title={item.name}>
										{item.name}
									</span>
								) : (
									<Link
										className={buttonStyles({
											variant: 'unset',
											className:
												'group-hover:text-base-lavender-600 dark:group-hover:text-base-lavender-400 group-pressed:text-base-neutral-900 dark:group-pressed:text-base-neutral-40 print:inline-flex',
										})}
										href={`/metadata-templates/${item.pk}`}
										variant="unset"
									>
										<span className="max-w-[30ch] truncate" title={item.name}>
											{item.name}
										</span>
									</Link>
								)}
							</TableCell>
							<TableCell style={{ width: '200px' }} textValue={item.assigned_to_content_object_name ?? ''}>
								<MetadataTemplateContainerBadge
									className="max-w-[30ch] cursor-pointer group-hover:no-underline"
									contentType={item.assigned_to_content_type}
									name={item.assigned_to_content_object_name}
									projectUuid={item.project?.pk}
									uuid={item.assigned_to_object_id}
								/>
							</TableCell>
							<TableCell style={{ width: '300px' }} textValue={`${item.created_by.email} - ${item.creation_date}`}>
								<div className="flex h-full place-items-center gap-2 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
									<Wand2Icon aria-hidden size={18} strokeWidth={1.5} />
									<div className="flex place-items-center gap-1">
										<span title={item.created_by.email} className="inline-block max-w-[20ch] truncate">
											{item.created_by.email}
										</span>{' '}
										– <span>{format(item.creation_date, 'MMM D, YYYY hh:mm', 'en')}</span>
									</div>
								</div>
							</TableCell>
							<TableCell style={{ width: '50px' }} textValue="Actions">
								<div className="flex place-content-end">
									{/* <ProjectsMoreMenu projectName={item.metadata_template_container.name} uuid={item.pk} /> */}
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
