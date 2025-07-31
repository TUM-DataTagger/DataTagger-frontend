import { RefreshCwIcon } from 'lucide-react';
import { NotFoundIcon } from '@/components/icons/NotFoundIcon';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/styles/ui/button';

export function GenericComponentErrorBoundary({
	error,
	reset,
	resetErrorBoundary,
}: {
	readonly error: Error & { digest?: string };
	reset?(): void;
	resetErrorBoundary?(): void;
}) {
	console.error(error);

	return (
		<div className="mx-auto my-auto flex max-w-[820px] flex-col place-items-center gap-4">
			<NotFoundIcon />
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-base-lg md:text-base-heading-xs text-center">Error: Error</h1>
					<p className="text-base-md md:text-base-lg text-center">
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
