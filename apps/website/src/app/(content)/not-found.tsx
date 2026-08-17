import { HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { NotFoundIcon } from '@/components/icons/NotFoundIcon';
import { buttonStyles } from '@/styles/ui/button';

export default function NotFound() {
	return (
		<div className="grow bg-base-neutral-60 dark:bg-base-neutral-700">
			<div className="mx-auto flex max-w-[820px] flex-col place-items-center gap-4 pt-44">
				<NotFoundIcon />
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h1 className="text-center text-base-lg md:text-base-heading-xs">Error 404: Page not found</h1>
						<p className="text-center text-base-md md:text-base-lg">
							This page is not available. Check the URL or navigate to another page.
						</p>
					</div>
					<Link className={buttonStyles({ variant: 'filled', className: 'place-self-center' })} href="/drafts">
						<HomeIcon aria-hidden size={18} strokeWidth={1.5} /> Home
					</Link>
				</div>
			</div>
		</div>
	);
}
