import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { AccountSettingsContent } from '@/app/(main)/account/settings/AccountSettingsContent';

const settingsMocks = vi.hoisted(() => ({
	mutate: vi.fn(),
	setTheme: vi.fn(),
}));

vi.mock('next-themes', () => ({
	useTheme: () => ({
		setTheme: settingsMocks.setTheme,
		theme: 'system',
	}),
}));

vi.mock('@/hooks/useUserSettings', () => ({
	useUserSettings: () => ({
		settings: {
			defaultViewMode: 'grid',
			draftsSort: '-creation_date',
			draftsViewMode: 'default',
			filesSort: 'display_name',
			filesViewMode: 'default',
			foldersSort: 'name',
			foldersViewMode: 'default',
			projectsSort: 'name',
			projectsViewMode: 'default',
			theme: 'system',
			version: 2,
		},
	}),
}));

vi.mock('@/hooks/useUserSettingsMutation', () => ({
	useUserSettingsMutation: () => ({
		isPending: false,
		mutate: settingsMocks.mutate,
	}),
}));

describe('AccountSettingsContent', () => {
	beforeEach(() => {
		settingsMocks.mutate.mockClear();
		settingsMocks.setTheme.mockClear();
	});

	it('uses the Figma drill-in flow on mobile and vertical tabs on desktop', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			const appearanceButton = page.getByRole('button', { name: 'Appearance' });

			await expect.element(appearanceButton).toBeVisible();
			expect(page.getByRole('heading', { level: 1, name: 'Appearance' }).query()).toBeNull();

			await appearanceButton.click();

			await expect.element(page.getByRole('heading', { level: 1, name: 'Appearance' })).toBeVisible();
			await expect.element(page.getByRole('button', { exact: true, name: 'Settings' })).toHaveFocus();

			await page.getByRole('button', { exact: true, name: 'Settings' }).click();

			await expect.element(appearanceButton).toHaveFocus();
			expect(page.getByRole('heading', { level: 1, name: 'Appearance' }).query()).toBeNull();
			return;
		}

		const appearanceTab = page.getByRole('tab', { name: 'Appearance' });
		const viewSettingsTab = page.getByRole('tab', { name: 'Customized view settings' });

		await expect.element(appearanceTab).toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('heading', { level: 1, name: 'Appearance' })).toBeVisible();

		await appearanceTab.click();
		await userEvent.keyboard('{ArrowDown}');

		await expect.element(viewSettingsTab).toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('heading', { level: 1, name: 'Customized view settings' })).toBeVisible();
	});

	it('keeps the selected settings tab lavender while the pointer remains over it', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			expect(page.getByRole('tab', { name: 'Customized view settings' }).query()).toBeNull();
			return;
		}

		const viewSettingsTab = page.getByRole('tab', { name: 'Customized view settings' });

		await viewSettingsTab.click();
		await viewSettingsTab.hover();
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 250);
		});

		await expect.element(viewSettingsTab).toHaveAttribute('aria-selected', 'true');
		expect(getComputedStyle(viewSettingsTab.element()).backgroundColor).toBe('rgb(143, 129, 234)');
	});

	it('lets the settings navigation contract on narrower desktop layouts', async () => {
		await render(
			<div className="w-[900px]">
				<AccountSettingsContent />
			</div>,
		);

		if (window.innerWidth < 768) return;

		const settingsNavigation = page.getByRole('navigation', { name: 'Settings' });
		const navigationWidth = settingsNavigation.element().getBoundingClientRect().width;

		expect(navigationWidth).toBeGreaterThanOrEqual(240);
		expect(navigationWidth).toBeLessThan(320);
	});

	it('matches the Figma layout and typography for visual theme settings', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			await page.getByRole('button', { name: 'Appearance' }).click();
		}

		const visualSwitch = page.getByRole('radiogroup', { name: 'Visual switch' });
		const themeLabel = page
			.getByText('Visual theming', { exact: true })
			.elements()
			.find((element) => element.checkVisibility());
		const themeDescription = page
			.getByText('My preferred theme for the tool', { exact: true })
			.elements()
			.find((element) => element.checkVisibility());

		await expect.element(visualSwitch).toBeVisible();
		expect(getComputedStyle(visualSwitch.element()).display).toBe('flex');
		expect(themeLabel).toBeDefined();
		expect(themeDescription).toBeDefined();
		expect(getComputedStyle(themeLabel!).fontSize).toBe('14px');
		expect(getComputedStyle(themeDescription!).fontSize).toBe('12px');
	});

	it('matches the Figma disabled state for future settings sections', async () => {
		await render(<AccountSettingsContent />);

		const disabledSettingsItem = page
			.getByText('Metadata templates', { exact: false })
			.elements()
			.find((element) => element.checkVisibility());

		expect(disabledSettingsItem).toBeDefined();

		const styles = getComputedStyle(disabledSettingsItem!);

		expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
		expect(styles.borderTopColor).toBe('rgb(204, 204, 204)');
		expect(styles.borderTopWidth).toBe('1px');
		expect(styles.color).toBe('rgb(25, 25, 25)');
		expect(styles.columnGap).toBe('16px');
		expect(styles.minHeight).toBe('40px');
		expect(styles.opacity).toBe('0.38');
		expect(styles.paddingLeft).toBe('12px');
		expect(styles.paddingRight).toBe('16px');

		const trailingIcon = disabledSettingsItem!.querySelector<HTMLElement>('[data-slot="icon"]');

		if (window.innerWidth < 768) {
			expect(trailingIcon).not.toBeNull();
			expect(getComputedStyle(trailingIcon!).opacity).toBe('1');
		} else {
			expect(trailingIcon).toBeNull();
		}
	});

	it('uses equal-width mobile section links without horizontal button padding', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth >= 768) return;

		await page.getByRole('button', { name: 'Customized view settings' }).click();

		const navigation = page.getByRole('navigation', { name: 'Adjacent settings sections' });
		const previousButton = page.getByRole('button', { exact: true, name: 'Appearance' });
		const nextButton = page.getByRole('button', { exact: true, name: 'My draft files' });
		const navigationWidth = navigation.element().getBoundingClientRect().width;
		const previousStyles = getComputedStyle(previousButton.element());
		const nextStyles = getComputedStyle(nextButton.element());

		expect(previousButton.element().getBoundingClientRect().width).toBeCloseTo((navigationWidth - 16) / 2, 0);
		expect(nextButton.element().getBoundingClientRect().width).toBeCloseTo((navigationWidth - 16) / 2, 0);
		expect(previousStyles.paddingInline).toBe('0px');
		expect(nextStyles.paddingInline).toBe('0px');
		expect(previousStyles.columnGap).toBe('4px');
		expect(nextStyles.columnGap).toBe('4px');
	});

	it('persists theme and default layout changes', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			await page.getByRole('button', { name: 'Appearance' }).click();
		} else {
			await page.getByRole('tab', { name: 'Appearance' }).click();
		}
		await userEvent.keyboard('{Tab}{ArrowLeft}');

		expect(settingsMocks.setTheme).toHaveBeenCalledWith('dark');
		expect(settingsMocks.mutate).toHaveBeenCalledWith({ theme: 'dark' });

		if (window.innerWidth < 768) {
			await page.getByRole('button', { name: 'Customized view settings' }).click();
		} else {
			await page.getByRole('tab', { name: 'Customized view settings' }).click();
		}
		await page.getByRole('button', { name: 'Default layout' }).click();
		await page.getByRole('option', { name: 'Table view' }).click();

		expect(settingsMocks.mutate).toHaveBeenCalledWith({ defaultViewMode: 'table' });
	});

	it('persists draft and resource-specific sort and layout defaults', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			await page.getByRole('button', { exact: true, name: 'My draft files' }).click();
		} else {
			await page.getByRole('tab', { exact: true, name: 'My draft files' }).click();
		}

		await page.getByRole('button', { name: 'Drafts default sort option' }).click();
		await page.getByRole('option', { name: 'Name A-Z' }).click();
		await page.getByRole('button', { name: 'Drafts layout theme override' }).click();
		await page.getByRole('option', { name: 'Table view' }).click();

		expect(settingsMocks.mutate).toHaveBeenCalledWith({ draftsSort: 'display_name' });
		expect(settingsMocks.mutate).toHaveBeenCalledWith({ draftsViewMode: 'table' });

		if (window.innerWidth < 768) {
			await page.getByRole('button', { exact: true, name: 'Settings' }).click();
			await page.getByRole('button', { exact: true, name: 'Projects, Folders, Files' }).click();
		} else {
			await page.getByRole('tab', { exact: true, name: 'Projects, Folders, Files' }).click();
		}

		await page.getByRole('tab', { exact: true, name: 'Folders' }).click();
		await page.getByRole('button', { name: 'Folders default sort option' }).click();
		await page.getByRole('option', { name: 'Name Z-A' }).click();
		await page.getByRole('button', { name: 'Folders layout theme override' }).click();
		await page.getByRole('option', { name: 'Grid view' }).click();

		expect(settingsMocks.mutate).toHaveBeenCalledWith({ foldersSort: '-name' });
		expect(settingsMocks.mutate).toHaveBeenCalledWith({ foldersViewMode: 'grid' });
	});

	it('uses project-style resource tabs and icons for every layout choice', async () => {
		await render(<AccountSettingsContent />);

		if (window.innerWidth < 768) {
			await page.getByRole('button', { exact: true, name: 'Projects, Folders, Files' }).click();
		} else {
			await page.getByRole('tab', { exact: true, name: 'Projects, Folders, Files' }).click();
		}

		const resourceTabList = page.getByRole('tablist', { name: 'Resource type' });
		const projectsTab = page.getByRole('tab', { exact: true, name: 'Projects' });
		const foldersTab = page.getByRole('tab', { exact: true, name: 'Folders' });
		const filesTab = page.getByRole('tab', { exact: true, name: 'Files' });
		const selectedIndicator = projectsTab.element().querySelector<HTMLElement>('[data-slot="selected-indicator"]');

		expect(getComputedStyle(resourceTabList.element()).borderBottomWidth).not.toBe('0px');
		expect(selectedIndicator).not.toBeNull();
		expect(selectedIndicator!.getBoundingClientRect().width).toBeGreaterThan(
			selectedIndicator!.getBoundingClientRect().height * 4,
		);
		const tabWidths = [projectsTab, foldersTab, filesTab].map((tab) => tab.element().getBoundingClientRect().width);
		expect(Math.max(...tabWidths) - Math.min(...tabWidths)).toBeGreaterThan(16);

		const layoutTrigger = page.getByRole('button', { name: 'Projects layout theme override' });
		expect(layoutTrigger.element().querySelectorAll('[data-slot="layout-icon"]')).toHaveLength(1);
		const layoutIcon = layoutTrigger.element().querySelector<HTMLElement>('[data-slot="layout-icon"]')!;
		const layoutGlyph = layoutIcon.querySelector<SVGElement>('svg')!;
		const layoutLabel = layoutTrigger.element().querySelector<HTMLElement>('[data-slot="layout-label"]')!;
		const iconRect = layoutIcon.getBoundingClientRect();
		const glyphRect = layoutGlyph.getBoundingClientRect();
		const labelRect = layoutLabel.getBoundingClientRect();
		const triggerRect = layoutTrigger.element().getBoundingClientRect();
		expect(triggerRect.width).toBeCloseTo(157, 0);
		expect(triggerRect.height).toBeCloseTo(40, 0);
		expect(iconRect.width).toBeCloseTo(18, 0);
		expect(iconRect.height).toBeCloseTo(18, 0);
		expect(labelRect.left - iconRect.right).toBeCloseTo(8, 0);
		expect(Math.abs(iconRect.top + iconRect.height / 2 - (labelRect.top + labelRect.height / 2))).toBeLessThanOrEqual(
			2,
		);
		expect(glyphRect.top + glyphRect.height / 2 - (labelRect.top + labelRect.height / 2)).toBeCloseTo(1, 0);

		await layoutTrigger.click();
		for (const label of ['Use general default', 'Grid view', 'Table view']) {
			const option = page.getByRole('option', { name: label });
			expect(option.element().querySelector('[data-slot="layout-icon"]')).not.toBeNull();
		}
	});
});
