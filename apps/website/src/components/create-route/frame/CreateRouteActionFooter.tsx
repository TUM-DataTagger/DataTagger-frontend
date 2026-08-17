import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

type CreateRouteActionFooterProps = {
	readonly alignment?: 'between' | 'end';
	readonly backHref?: string;
	readonly backLabel?: string;
	readonly cancelButton: ReactNode;
	readonly form: string;
	readonly submitLabel: string;
};

export function CreateRouteActionFooter({
	alignment = 'end',
	backHref,
	backLabel = 'Back',
	cancelButton,
	form,
	submitLabel,
}: CreateRouteActionFooterProps) {
	return (
		<div
			className={cx(
				'flex h-[88px] place-items-center border-t border-base-neutral-100 px-4 py-6 md:px-[132px] dark:border-base-neutral-700',
				alignment === 'between' ? 'place-content-between' : 'place-content-end',
			)}
		>
			{backHref ? (
				<Link className={buttonStyles({ variant: 'outline' })} href={backHref}>
					{backLabel}
				</Link>
			) : null}
			<div className="flex gap-2">
				{cancelButton}
				<Button form={form} type="submit" variant="filled">
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}
