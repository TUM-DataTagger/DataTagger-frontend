import { RefreshCwIcon } from 'lucide-react';
import { getErrorMessage } from 'react-error-boundary';
import { NotFoundIcon } from '@/components/icons/NotFoundIcon';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/styles/ui/button';
import { logger, LogCategory } from '@/util/logger';

export function GenericComponentErrorBoundary({
	error,
	reset,
	resetErrorBoundary,
}: {
	readonly error: unknown;
	reset?(): void;
	resetErrorBoundary?(): void;
}) {
	logger.error(LogCategory.Error, 'Component error', { message: getErrorMessage(error) });

	return (
		<div className="mx-auto my-auto flex max-w-[820px] flex-col place-items-center gap-4">
			<NotFoundIcon />
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-center text-base-lg md:text-base-heading-xs">Error: Error</h1>
					<p className="text-center text-base-md md:text-base-lg">
						This component has entered an errornous state. Click retry to try again.
					</p>
				</div>
				<Button
					className={buttonStyles({ variant: 'filled', className: 'place-self-center' })}
					onPress={() => reset?.() ?? resetErrorBoundary?.()}
				>
					<RefreshCwIcon aria-hidden size={18} strokeWidth={1.5} /> Retry
				</Button>
			</div>
		</div>
	);
}
