'use client';

import { MissingTagSmallIcon } from '@/components/icons/MissingTagIcon';
import { Tag, TagGroup } from '@/components/ui/TagGroup';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cx } from '@/styles/cva';

export function FileMissingMetadataBadge() {
	return (
		<Tooltip delay={400}>
			<TooltipTrigger className="place-content-start" variant="unset">
				<TagGroup aria-label="Missing metadata" className="place-self-auto">
					<Tag color="warning" textValue="Missing metadata">
						<MissingTagSmallIcon aria-hidden className="shrink-0" height={18} width={18} />
						Missing metadata
					</Tag>
				</TagGroup>
			</TooltipTrigger>
			<TooltipContent variant="plain">Metadata values are missing</TooltipContent>
		</Tooltip>
	);
}

export function FileMissingMetadataIndicator(props: { readonly className?: string | undefined }) {
	return (
		<Tooltip delay={400}>
			<TooltipTrigger
				className={cx(
					'bg-base-tangerine-100 text-base-tangerine-800 dark:bg-base-tangerine-800 dark:text-base-tangerine-100',
					props.className,
				)}
				size="icon-xs"
				variant="unset"
			>
				<MissingTagSmallIcon aria-hidden height={18} width={18} />
			</TooltipTrigger>
			<TooltipContent variant="plain">Metadata values are missing</TooltipContent>
		</Tooltip>
	);
}
