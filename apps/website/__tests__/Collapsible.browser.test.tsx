import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Collapsible } from '@/components/ui/Collapsible';

function CollapsibleHarness(props: { readonly initialOpen?: boolean }) {
	const [isOpen, setIsOpen] = useState(props.initialOpen ?? false);

	return (
		<>
			<button onClick={() => setIsOpen((value) => !value)} type="button">
				Toggle
			</button>
			<Collapsible isOpen={isOpen}>
				<button data-testid="inside" type="button">
					Inside
				</button>
			</Collapsible>
		</>
	);
}

function getCollapsibleRegion(inside: HTMLElement) {
	return inside.parentElement;
}

describe('Collapsible', () => {
	it('keeps children unreachable to focus while collapsed and reachable once expanded', async () => {
		const screen = await render(<CollapsibleHarness />);

		const inside = screen.getByTestId('inside').element() as HTMLButtonElement;

		inside.focus();
		expect(document.activeElement).not.toBe(inside);

		await screen.getByRole('button', { name: 'Toggle' }).click();

		inside.focus();
		expect(document.activeElement).toBe(inside);
	});

	it('marks the region aria-hidden while collapsed and clears it once expanded', async () => {
		const screen = await render(<CollapsibleHarness />);

		const inside = screen.getByTestId('inside').element() as HTMLButtonElement;
		const region = getCollapsibleRegion(inside);

		expect(region).toHaveAttribute('aria-hidden', 'true');

		await screen.getByRole('button', { name: 'Toggle' }).click();

		expect(region).not.toHaveAttribute('aria-hidden');
	});
});
