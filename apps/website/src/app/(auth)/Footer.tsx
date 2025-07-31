import { ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Version } from '@/components/Version';
import { BigLogoIconNoSSR } from '@/components/icons/BigLogoIcon';

export default async function Footer() {
	return (
		<div className="mt-4 flex flex-col md:mt-0 md:h-[132px] print:hidden">
			<div className="border-base-neutral-100 dark:border-base-neutral-700 flex flex-col place-content-between place-items-center gap-8 border-t px-4 py-[25px] md:h-20 md:flex-row md:px-[132px]">
				<div className="flex flex-col place-items-center gap-[30px] md:flex-row">
					<a href="https://www.tum.de" rel="noreferrer noopener external" target="_blank">
						<BigLogoIconNoSSR />
					</a>
					<span className="text-base-neutral-600 dark:text-base-neutral-300 text-center md:text-left">
						University Library
						<br />
						Technical University of Munich
					</span>
				</div>
				<nav className="flex flex-wrap place-content-center place-items-center gap-4 md:flex-nowrap">
					<a
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full py-[6px] pr-2 pl-3 outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="https://domain.com/datatagger"
						rel="noreferrer noopener external"
						target="_blank"
					>
						Contact <ExternalLinkIcon aria-hidden size={18} strokeWidth={1.5} />
					</a>
					<a
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full py-[6px] pr-2 pl-3 outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="https://domain.com/impressum"
						rel="noreferrer noopener external"
						target="_blank"
					>
						Imprint <ExternalLinkIcon aria-hidden size={18} strokeWidth={1.5} />
					</a>
					<Link
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full px-3 py-[6px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="/privacy-policy"
					>
						Privacy policy
					</Link>
					<Link
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full px-3 py-[6px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="/accessibility"
					>
						Accessibility
					</Link>
					<Link
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full px-3 py-[6px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="/terms-of-use"
					>
						Terms of use
					</Link>
					<Link
						className="active:bg-base-neutral-200 hover:bg-base-neutral-80 hover:active:bg-base-neutral-200 focus-visible:bg-base-neutral-80 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 dark:active:bg-base-neutral-600 dark:hover:bg-base-neutral-700/72 dark:hover:active:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-700/72 flex place-items-center gap-1 rounded-full px-3 py-[6px] outline-0 outline-offset-2 focus-visible:outline-2 forced-colors:outline-[Highlight]"
						href="/faq"
					>
						FAQ
					</Link>
				</nav>
			</div>
			<div className="border-base-neutral-100 bg-base-neutral-100/16 dark:border-base-neutral-700 dark:bg-base-neutral-700/24 flex flex-col-reverse place-content-between place-items-center gap-6 border-t px-10 py-4 md:h-[52px] md:flex-row md:px-[132px]">
				<span className="text-base-neutral-600 dark:text-base-neutral-300">
					DataTagger <Version />
				</span>
				<span>The source code is available on GitHub</span>
			</div>
		</div>
	);
}
