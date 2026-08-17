import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import {
	getAvailableMetadataTypeOptions,
	MetadataTypeMenu,
	useMetadataTypeState,
	type MetadataFieldType,
} from '@/components/Metadata';

function MetadataTypeMenuHarness(props: {
	readonly defaultFieldType?: MetadataFieldType;
	readonly onTypeChange?: ((fieldType: MetadataFieldType) => void) | undefined;
}) {
	const metadataTypeState = useMetadataTypeState({
		defaultFieldType: props.defaultFieldType ?? 'TEXT',
	});
	const metadataTypeOptions = getAvailableMetadataTypeOptions();

	return (
		<MetadataTypeMenu
			metadataTemplateFieldTypeState={metadataTypeState}
			onTypeChange={props.onTypeChange}
			options={metadataTypeOptions}
		/>
	);
}

async function clickMenuOption(label: string) {
	const radioOption = page.getByRole('menuitemradio', { name: label });
	if (radioOption.query() !== null) {
		await radioOption.click();
		return;
	}

	await page.getByRole('menuitem', { name: label }).click();
}

describe('MetadataTypeMenu browser behavior', () => {
	it('updates trigger label and callback when selecting Multi select from the real menu', async () => {
		const onTypeChange = vi.fn();
		const screen = await render(<MetadataTypeMenuHarness onTypeChange={onTypeChange} />);
		const trigger = screen.getByRole('button', {
			name: 'Metadata template field type menu',
		});

		await expect.element(trigger).toHaveTextContent('Text');

		await trigger.click();
		await clickMenuOption('Multi select');

		await expect.element(trigger).toHaveTextContent('Multi select');
		expect(onTypeChange).toHaveBeenCalledWith('MULTI_SELECTION');
	});

	it('updates trigger label and callback when selecting Tag from the real menu', async () => {
		const onTypeChange = vi.fn();
		const screen = await render(<MetadataTypeMenuHarness onTypeChange={onTypeChange} />);
		const trigger = screen.getByRole('button', {
			name: 'Metadata template field type menu',
		});

		await expect.element(trigger).toHaveTextContent('Text');
		await trigger.click();
		await clickMenuOption('Tag');

		await expect.element(trigger).toHaveTextContent('Tag');
		expect(onTypeChange).toHaveBeenCalledWith('TAG');
	});
});
