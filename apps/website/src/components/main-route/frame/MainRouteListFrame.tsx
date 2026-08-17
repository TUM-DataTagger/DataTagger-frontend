import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { GenericComponentErrorBoundary } from '@/components/ErrorBoundary';
import { Pagination } from '@/components/ui/Pagination';

type MainRouteListFramePagination = {
	readonly count: number;
	readonly length: number;
	readonly limit: number;
	readonly offset: number;
};

type MainRouteListFrameProps = {
	readonly controls: ReactNode;
	readonly empty?: ReactNode;
	readonly hasResults: boolean;
	readonly layout: 'grid' | 'table';
	readonly list: ReactNode;
	readonly pagination?: MainRouteListFramePagination;
	readonly preListContent?: ReactNode;
};

function FrameContent(props: MainRouteListFrameProps) {
	return (
		<>
			{props.controls}
			{props.preListContent}
			{props.pagination ? <Pagination {...props.pagination} /> : null}
			{props.hasResults ? props.list : props.empty}
			{props.pagination ? <Pagination {...props.pagination} /> : null}
		</>
	);
}

export function MainRouteListFrame(props: MainRouteListFrameProps) {
	return (
		<ErrorBoundary FallbackComponent={GenericComponentErrorBoundary}>
			<FrameContent {...props} />
		</ErrorBoundary>
	);
}
