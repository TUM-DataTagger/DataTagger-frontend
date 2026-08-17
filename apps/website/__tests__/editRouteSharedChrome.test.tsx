// @vitest-environment happy-dom

import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateRouteActionFooter } from '@/components/create-route/frame/CreateRouteActionFooter';
import { EditRouteTopBar } from '@/components/edit-route/frame/EditRouteTopBar';

vi.mock('next/link', () => ({
	default: ({
		children,
		href,
		...props
	}: {
		readonly children: ReactNode;
		readonly href: string;
		readonly [key: string]: unknown;
	}) => (
		<a href={href} {...(props as Record<string, unknown>)}>
			{children}
		</a>
	),
}));

vi.mock('@/components/ui/Button', () => ({
	Button: ({
		children,
		onPress,
		...props
	}: {
		readonly children: ReactNode;
		readonly onPress?: (() => void | Promise<void>) | undefined;
		readonly [key: string]: unknown;
	}) => {
		const buttonProps = props as Record<string, unknown>;
		const type = buttonProps.type;
		const commonProps = {
			...buttonProps,
			onClick: () => {
				void onPress?.();
			},
		};

		if (type === 'submit') {
			return (
				<button {...commonProps} type="submit">
					{children}
				</button>
			);
		}

		if (type === 'reset') {
			return (
				<button {...commonProps} type="reset">
					{children}
				</button>
			);
		}

		return (
			<button {...commonProps} type="button">
				{children}
			</button>
		);
	},
}));

describe('shared route chrome', () => {
	afterEach(() => {
		cleanup();
	});

	it('project create action footer renders back link, cancel content, and submit button contract', () => {
		const screen = render(
			<CreateRouteActionFooter
				alignment="between"
				backHref="/projects/create/0"
				backLabel="Previous step"
				cancelButton={<button type="button">Cancel</button>}
				form="project-create"
				submitLabel="Save & complete"
			/>,
		);

		const root = screen.container.firstElementChild as HTMLElement | null;
		expect(root).toBeTruthy();
		expect(root?.className).toContain('place-content-between');

		const backLink = screen.getByRole('link', { name: 'Previous step' });
		expect(backLink.getAttribute('href')).toBe('/projects/create/0');

		expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();

		const submitButton = screen.getByRole('button', { name: 'Save & complete' });
		expect(submitButton.getAttribute('type')).toBe('submit');
		expect(submitButton.getAttribute('form')).toBe('project-create');
	});

	it('project create action footer defaults to end alignment and no back link', () => {
		const screen = render(
			<CreateRouteActionFooter
				cancelButton={<button type="button">Cancel</button>}
				form="project-create"
				submitLabel="Next step"
			/>,
		);

		const root = screen.container.firstElementChild as HTMLElement | null;
		expect(root?.className).toContain('place-content-end');
		expect(screen.queryByRole('link', { name: 'Back' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy();
	});

	it('edit top bar renders title and close button slot content', () => {
		const screen = render(
			<EditRouteTopBar closeButton={<button type="button">Close</button>} title="Edit file metadata" />,
		);

		expect(screen.getByText('Edit file metadata')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();

		const root = screen.container.firstElementChild as HTMLElement | null;
		expect(root?.className).toContain('sticky');
		expect(root?.className).toContain('place-content-between');
	});
});
