'use client';

import { Share2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

export function ShareButton() {
	const isMobile = useMediaQuery('(max-width: 600px)', { initializeWithValue: false });
	const [isOpen, setIsOpen] = useState(false);
	const [tooltipText, setTooltipText] = useState('Share link');
	const [, copy] = useCopyToClipboard();
	const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | undefined>();

	const resetTooltipText = () => {
		setTooltipText('Share link');
	};

	const copyToClipboard = async () => {
		if (isMobile) {
			await navigator.share({ url: window.location.href });
		} else {
			await copy(window.location.href);
			setIsOpen(true);
			setTooltipText('Link copied');

			globalToastQueue.add(
				{ message: 'Link has been copied to clipboard.', type: ToastType.TextOnly },
				{ timeout: 2_500 },
			);

			setTooltipTimeout(
				setTimeout(() => {
					setIsOpen(false);
					resetTooltipText();
				}, 1_500),
			);
		}
	};

	useEffect(
		() => () => {
			clearTimeout(tooltipTimeout);
			setTooltipTimeout(undefined);
		},
		[tooltipTimeout],
	);

	return (
		<Tooltip delay={400} isOpen={isOpen} onOpenChange={setIsOpen}>
			<TooltipTrigger aria-label="Share" onPress={async () => copyToClipboard()} size="icon" variant="discreet">
				<Share2Icon aria-hidden size={18} strokeWidth={1.5} />
			</TooltipTrigger>
			<TooltipContent showArrow={false}>{tooltipText}</TooltipContent>
		</Tooltip>
	);
}
