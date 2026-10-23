import { ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Version } from '@/components/Version';
import { BigLogoIconNoSSR } from '@/components/icons/BigLogoIcon';
import { getBranding } from '@/util/branding';

export default async function Footer() {
	const { appName, institution, links } = await getBranding();

	return (
		<div className="mt-4 flex flex-col md:mt-0 md:h-[132px] print:hidden">
			<div className="flex flex-col place-content-between place-items-center gap-8 border-t border-base-neutral-100 px-4 py-6.25 md:h-20 md:flex-row md:px-[132px] dark:border-base-neutral-700">
				<div className="flex flex-col place-items-center gap-7.5 md:flex-row">
					{institution.url ? (
						<a href={institution.url} rel="noreferrer noopener external" target="_blank">
							<BigLogoIconNoSSR />
						</a>
					) : (
						<BigLogoIconNoSSR />
					)}
					<span className="text-center text-base-neutral-600 md:text-left dark:text-base-neutral-300">
						{institution.unit}
						{institution.unit && institution.name ? <br /> : null}
						{institution.name}
					</span>
				</div>
				<nav className="flex flex-wrap place-content-center place-items-center gap-4 md:flex-nowrap">
					{links.contact ? (
						<a
							className="flex place-items-center gap-1 rounded-full py-1.5 pr-2 pl-3 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
							href={links.contact}
							rel="noreferrer noopener external"
							target="_blank"
						>
							Contact <ExternalLinkIcon aria-hidden size={18} strokeWidth={1.5} />
						</a>
					) : null}
					{links.imprint ? (
						<a
							className="flex place-items-center gap-1 rounded-full py-1.5 pr-2 pl-3 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
							href={links.imprint}
							rel="noreferrer noopener external"
							target="_blank"
						>
							Imprint <ExternalLinkIcon aria-hidden size={18} strokeWidth={1.5} />
						</a>
					) : null}
					<Link
						className="flex place-items-center gap-1 rounded-full px-3 py-1.5 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
						href="/privacy-policy"
					>
						Privacy policy
					</Link>
					<Link
						className="flex place-items-center gap-1 rounded-full px-3 py-1.5 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
						href="/accessibility"
					>
						Accessibility
					</Link>
					<Link
						className="flex place-items-center gap-1 rounded-full px-3 py-1.5 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
						href="/terms-of-use"
					>
						Terms of use
					</Link>
					<Link
						className="flex place-items-center gap-1 rounded-full px-3 py-1.5 outline-0 outline-offset-2 hover:bg-base-neutral-80 focus-visible:bg-base-neutral-80 focus-visible:outline-2 focus-visible:outline-base-lavender-400 active:bg-base-neutral-200 hover:active:bg-base-neutral-200 dark:outline-base-lavender-600 dark:hover:bg-base-neutral-700/72 dark:focus-visible:bg-base-neutral-700/72 dark:active:bg-base-neutral-600 dark:hover:active:bg-base-neutral-600 forced-colors:outline-[Highlight]"
						href="/faq"
					>
						FAQ
					</Link>
				</nav>
			</div>
			<div className="flex flex-col-reverse place-content-between place-items-center gap-6 border-t border-base-neutral-100 bg-base-neutral-100/16 px-10 py-4 md:h-13 md:flex-row md:px-[132px] dark:border-base-neutral-700 dark:bg-base-neutral-700/24">
				<span className="text-base-neutral-600 dark:text-base-neutral-300">
					{appName} <Version />
				</span>
				<span>The source code is available on GitHub</span>
			</div>
		</div>
	);
}
