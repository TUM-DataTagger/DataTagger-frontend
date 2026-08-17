// @vitest-environment happy-dom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateRouteCancelButton } from '@/components/create-route/frame/CreateRouteCancelButton';
import { CreateRouteCloseButton } from '@/components/create-route/frame/CreateRouteCloseButton';
import { EditRouteCancelButton } from '@/components/edit-route/frame/EditRouteCancelButton';
import { EditRouteCloseButton } from '@/components/edit-route/frame/EditRouteCloseButton';
import { EditRouteSaveFooter } from '@/components/edit-route/frame/EditRouteSaveFooter';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: pushMock,
	}),
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

async function expectNavigatesAfterBeforeHook(
	rendered: ReturnType<typeof render>,
	buttonName: string,
	href: string,
	events: string[],
) {
	fireEvent.click(rendered.getByRole('button', { name: buttonName }));

	await waitFor(() => {
		expect(pushMock).toHaveBeenCalledWith(href);
	});

	expect(events).toEqual(['before', `push:${href}`]);
}

describe('shared route shell controls', () => {
	beforeEach(() => {
		pushMock.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it('project create close button awaits onBeforeNavigate before pushing', async () => {
		const events: string[] = [];
		pushMock.mockImplementation((href: string) => {
			events.push(`push:${href}`);
		});

		const screen = render(
			<CreateRouteCloseButton
				href="/projects"
				onBeforeNavigate={async () => {
					events.push('before');
					await Promise.resolve();
				}}
			/>,
		);

		await expectNavigatesAfterBeforeHook(screen, 'Close', '/projects', events);
	});

	it('project create cancel button awaits onBeforeNavigate before pushing', async () => {
		const events: string[] = [];
		pushMock.mockImplementation((href: string) => {
			events.push(`push:${href}`);
		});

		const screen = render(
			<CreateRouteCancelButton
				href="../folders"
				onBeforeNavigate={async () => {
					events.push('before');
					await Promise.resolve();
				}}
			/>,
		);

		await expectNavigatesAfterBeforeHook(screen, 'Cancel', '../folders', events);
	});

	it('edit close button awaits onBeforeNavigate before pushing', async () => {
		const events: string[] = [];
		pushMock.mockImplementation((href: string) => {
			events.push(`push:${href}`);
		});

		const screen = render(
			<EditRouteCloseButton
				href="/projects/123/folders"
				onBeforeNavigate={async () => {
					events.push('before');
					await Promise.resolve();
				}}
			/>,
		);

		await expectNavigatesAfterBeforeHook(screen, 'Close', '/projects/123/folders', events);
	});

	it('edit cancel button awaits onBeforeNavigate before pushing', async () => {
		const events: string[] = [];
		pushMock.mockImplementation((href: string) => {
			events.push(`push:${href}`);
		});

		const screen = render(
			<EditRouteCancelButton
				href="../files"
				onBeforeNavigate={async () => {
					events.push('before');
					await Promise.resolve();
				}}
			/>,
		);

		await expectNavigatesAfterBeforeHook(screen, 'Cancel', '../files', events);
	});

	it('edit save footer passes form id to submit button and uses default label', () => {
		const screen = render(
			<EditRouteSaveFooter cancelButton={<button type="button">Cancel</button>} form="test-form" />,
		);

		expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();

		const submitButton = screen.getByRole('button', { name: 'Save changes' });
		expect(submitButton.getAttribute('type')).toBe('submit');
		expect(submitButton.getAttribute('form')).toBe('test-form');
	});

	it('edit save footer supports custom submit label', () => {
		const screen = render(
			<EditRouteSaveFooter
				cancelButton={<button type="button">Cancel</button>}
				form="edit-form"
				submitLabel="Update metadata"
			/>,
		);

		expect(screen.getByRole('button', { name: 'Update metadata' }).getAttribute('form')).toBe('edit-form');
	});
});
