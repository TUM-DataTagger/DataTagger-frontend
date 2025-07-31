'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates, parseAsInteger } from 'nuqs';
import { ErrorBoundary } from 'react-error-boundary';
import { useMediaQuery } from 'usehooks-ts';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { ViewSwitch } from '@/components/ViewSwitch';
import { Pagination } from '@/components/ui/Pagination';
import { $api } from '@/util/clientFetch';
import { MetadataTemplatesGrid } from './MetadataTemplatesGrid';
import { MetadataTemplatesSortByMenu } from './MetadataTemplatesSortByMenu';
import { MetadataTemplatesTable } from './MetadataTemplatesTable';
import { MetadataTemplatesViewEmpty } from './MetadataTemplatesViewEmpty';

export function MetadataTemplatesView(props: { readonly limit: number }) {
	const [queryStates] = useQueryStates({
		page: parseAsInteger.withDefault(1),
		sort: parseAsString.withDefault('name'),
		view: parseAsString.withDefault('grid'),
	});
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });

	const offset = (queryStates.page - 1) * props.limit;

	const { data: metadataTemplatesData } = useSuspenseQuery(
		$api.queryOptions(
			'get',
			'/api/v1/metadata-template/',
			{
				params: { query: { limit: props.limit, offset, ordering: queryStates.sort } },
			},
			{ placeholderData: keepPreviousData },
		),
	);

	const hasResults = metadataTemplatesData.results?.length;

	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<div className="flex flex-col gap-4">
				<div className="flex place-content-between place-items-center">
					<MetadataTemplatesSortByMenu isDisabled={!hasResults} />
					<ViewSwitch className="hidden md:flex" isDisabled={!hasResults} />
				</div>
			</div>

			{hasResults ? (
				<Pagination
					count={metadataTemplatesData.count ?? 0}
					length={metadataTemplatesData.results?.length ?? 0}
					limit={props.limit}
					offset={offset}
				/>
			) : null}

			{hasResults ? (
				queryStates.view === 'grid' || isMobile ? (
					<MetadataTemplatesGrid data={metadataTemplatesData.results} />
				) : (
					<MetadataTemplatesTable data={metadataTemplatesData.results} />
				)
			) : (
				<MetadataTemplatesViewEmpty />
			)}

			{hasResults ? (
				<Pagination
					count={metadataTemplatesData.count ?? 0}
					length={metadataTemplatesData.results?.length ?? 0}
					limit={props.limit}
					offset={offset}
				/>
			) : null}
		</ErrorBoundary>
	);
}
