'use client';

import { useAtomValue } from 'jotai';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { projectAtom, stepAtom } from '@/stores/createProject';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';

export function ProjectCreateStepper(props: { readonly className?: string }) {
	const pathname = usePathname();
	const projectStep = useAtomValue(stepAtom);
	const project = useAtomValue(projectAtom);

	const isStepOne = pathname === '/projects/create/1';
	const isStepTwo = pathname === '/projects/create/2';

	return (
		<div className={cx('flex place-content-center place-items-center gap-6', props.className)}>
			<Link
				className={buttonStyles({
					variant: 'unset',
					className: 'text-base-label-xs text-base-neutral-800 group',
				})}
				href="/projects/create/1"
			>
				<span
					className={cx(
						'flex size-[18px] place-content-center place-items-center rounded-full tabular-nums',
						isStepOne
							? 'bg-base-neutral-700 text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900'
							: 'border-base-neutral-300 dark:border-base-neutral-500 dark:text-base-neutral-100 border',
					)}
				>
					1
				</span>
				<span
					className={cx(
						isStepOne
							? 'group-pressed:underline dark:text-base-neutral-100 group-hover:underline group-focus-visible:underline'
							: 'text-base-neutral-600 dark:text-base-neutral-300',
					)}
				>
					Projects details
				</span>
			</Link>
			<Link
				aria-disabled={projectStep < 1 || !project.project.name}
				className={buttonStyles({
					variant: 'unset',
					className: 'text-base-label-xs text-base-neutral-800 group w-auto p-0 aria-disabled:pointer-events-none',
				})}
				href={projectStep === 0 || !project.project.name ? '#' : '/projects/create/2'}
			>
				<span
					className={cx(
						'flex size-[18px] place-content-center place-items-center rounded-full tabular-nums',
						isStepTwo
							? 'bg-base-neutral-700 text-base-neutral-40 dark:bg-base-neutral-100 dark:text-base-neutral-900'
							: 'border-base-neutral-300 dark:border-base-neutral-500 dark:text-base-neutral-100 border',
					)}
				>
					2
				</span>
				<span
					className={cx(
						isStepTwo
							? 'group-pressed:underline dark:text-base-neutral-100 group-hover:underline group-focus-visible:underline'
							: 'text-base-neutral-600 dark:text-base-neutral-300',
					)}
				>
					Folder details
				</span>
			</Link>
		</div>
	);
}
