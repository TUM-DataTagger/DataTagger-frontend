// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMetadataTypeMenuOptions, MetadataTypeMenu } from '@/components/Metadata';

type MetadataTypeState = Parameters<typeof MetadataTypeMenu>[0]['metadataTemplateFieldTypeState'];

vi.mock('@/components/ui/Menu', () => ({
	Menu: (props: { readonly children: ReactNode }) => <div>{props.children}</div>,
	MenuTrigger: (props: { readonly children: ReactNode } & Record<string, unknown>) => (
		<button aria-label={typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined} type="button">
			{props.children}
		</button>
	),
	MenuContent: (props: { readonly children: ReactNode } & Record<string, unknown>) => (
		<div role="menu">{props.children}</div>
	),
	MenuItem: (props: { readonly children: ReactNode } & Record<string, unknown>) => (
		<div role="menuitem">{props.children}</div>
	),
}));

afterEach(() => {
	cleanup();
});

function createMetadataTypeState(selectedType: 'TEXT' | 'MULTI_SELECTION' | 'TAG') {
	return {
		isMenuOpen: false,
		setIsMenuOpen: vi.fn(),
		selected: new Set([selectedType]),
		setSelected: vi.fn(),
		handleType: vi.fn(),
	} as unknown as MetadataTypeState;
}

describe('MetadataTypeMenu multi-select feature flag behavior', () => {
	it('excludes "Multi select" from the menu when the flag is off', () => {
		const { menuOptions, triggerOptions } = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: false,
			isTagMenuEnabled: false,
		});

		render(
			<MetadataTypeMenu
				menuOptions={menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('TEXT')}
				triggerOptions={triggerOptions}
			/>,
		);

		expect(screen.queryByRole('menuitem', { name: 'Multi select' })).toBeNull();
	});

	it('includes "Multi select" in the menu when the flag is on', () => {
		const { menuOptions, triggerOptions } = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: true,
			isTagMenuEnabled: false,
		});

		render(
			<MetadataTypeMenu
				menuOptions={menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('TEXT')}
				triggerOptions={triggerOptions}
			/>,
		);

		expect(screen.getByRole('menuitem', { name: 'Multi select' })).toBeDefined();
	});

	it('keeps trigger label readable for selected MULTI_SELECTION even when menu item is hidden', () => {
		const { menuOptions, triggerOptions } = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: false,
			isTagMenuEnabled: false,
		});

		render(
			<MetadataTypeMenu
				menuOptions={menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('MULTI_SELECTION')}
				triggerOptions={triggerOptions}
			/>,
		);

		const trigger = screen.getByRole('button', { name: 'Metadata template field type menu' });
		expect(trigger.textContent).toContain('Multi select');
		expect(screen.queryByRole('menuitem', { name: 'Multi select' })).toBeNull();
	});

	it('includes "Tag" in the menu only when the TAG flag is on', () => {
		const hiddenTagMenuOptions = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: true,
			isTagMenuEnabled: false,
		});

		render(
			<MetadataTypeMenu
				menuOptions={hiddenTagMenuOptions.menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('TEXT')}
				triggerOptions={hiddenTagMenuOptions.triggerOptions}
			/>,
		);

		expect(screen.queryByRole('menuitem', { name: 'Tag' })).toBeNull();

		cleanup();

		const visibleTagMenuOptions = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: true,
			isTagMenuEnabled: true,
		});

		render(
			<MetadataTypeMenu
				menuOptions={visibleTagMenuOptions.menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('TEXT')}
				triggerOptions={visibleTagMenuOptions.triggerOptions}
			/>,
		);

		expect(screen.getByRole('menuitem', { name: 'Tag' })).toBeDefined();
	});

	it('keeps trigger label readable for selected TAG even when menu item is hidden', () => {
		const { menuOptions, triggerOptions } = getMetadataTypeMenuOptions({
			isMultiSelectionMenuEnabled: true,
			isTagMenuEnabled: false,
		});

		render(
			<MetadataTypeMenu
				menuOptions={menuOptions}
				metadataTemplateFieldTypeState={createMetadataTypeState('TAG')}
				triggerOptions={triggerOptions}
			/>,
		);

		const trigger = screen.getByRole('button', { name: 'Metadata template field type menu' });
		expect(trigger.textContent).toContain('Tag');
		expect(screen.queryByRole('menuitem', { name: 'Tag' })).toBeNull();
	});
});
