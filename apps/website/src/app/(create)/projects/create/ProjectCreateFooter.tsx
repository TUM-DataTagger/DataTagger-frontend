import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { CancelButton } from './CancelButton';

export function ProjectCreateFooter(props: { readonly step: number }) {
	return (
		<div
			className={cx(
				'border-base-neutral-100 dark:border-base-neutral-700 flex h-[88px] place-items-center border-t px-4 py-6 md:px-[132px]',
				props.step === 0 ? 'place-content-end' : 'place-content-between',
			)}
		>
			{props.step === 1 ? (
				<Link className={buttonStyles({ variant: 'outline' })} href="/projects/create/1">
					Back
				</Link>
			) : null}
			<div className="flex gap-2">
				<CancelButton />
				<Button form="project-create" type="submit" variant="filled">
					{props.step === 0 ? 'Next step' : 'Save & complete'}
				</Button>
			</div>
		</div>
	);
}
