import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, type RenderResult } from 'vitest-browser-react';
import { Metadata, MetadataTemplateFieldValueInput } from '@/components/Metadata';
import {
	METADATA_OPTION_DUPLICATE_VALUE_MESSAGE,
	METADATA_OPTION_INVALID_VALUE_MESSAGE,
} from '@/util/metadataOptionValidation';

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => false),
}));

type SelectionState = {
	readonly options: string[];
	readonly selectedValue: string | null;
};

type MultiSelectionState = {
	readonly options: string[];
	readonly selectedValues: string[] | null;
};

function MetadataSelectionHarness({
	initialOptions,
	initialSelectedValue,
	isMetadataTemplateField = false,
	onStateChange,
}: {
	readonly initialOptions: string[];
	readonly initialSelectedValue: string | null;
	readonly isMetadataTemplateField?: boolean;
	readonly onStateChange?: ((state: SelectionState) => void) | undefined;
}) {
	const [state, setState] = useState<SelectionState>({
		options: initialOptions,
		selectedValue: initialSelectedValue,
	});

	useEffect(() => {
		onStateChange?.(state);
	}, [onStateChange, state]);

	const MetadataComponent = isMetadataTemplateField ? MetadataTemplateFieldValueInput : Metadata;

	return (
		<MetadataComponent
			errorMessage={undefined}
			fieldConfig={{ options: state.options }}
			fieldType="SELECTION"
			isDisabled={false}
			label="Value"
			onBlur={() => {}}
			onChange={(value) => {
				if (value.fieldType !== 'SELECTION' || value.value === null || typeof value.value === 'string') {
					return;
				}

				setState({
					options: value.value.options,
					selectedValue: value.value.selectedValue,
				});
			}}
			value={state.selectedValue}
		/>
	);
}

async function expectRadioChecked(screen: RenderResult, index: number, expected: boolean) {
	const radio = screen.getByRole('radio', { name: `Option ${index}` });
	if (expected) {
		await expect.element(radio).toBeChecked();
		return;
	}
	await expect.element(radio).not.toBeChecked();
}

function sortStrings(values: string[] | null | undefined): string[] {
	if (!values) {
		return [];
	}

	return [...values].sort((a, b) => a.localeCompare(b));
}

function MetadataMultiSelectionHarness({
	initialOptions,
	initialSelectedValues,
	isMetadataTemplateField = false,
	onStateChange,
}: {
	readonly initialOptions: string[];
	readonly initialSelectedValues: string[] | null;
	readonly isMetadataTemplateField?: boolean;
	readonly onStateChange?: ((state: MultiSelectionState) => void) | undefined;
}) {
	const [state, setState] = useState<MultiSelectionState>({
		options: initialOptions,
		selectedValues: initialSelectedValues,
	});

	useEffect(() => {
		onStateChange?.(state);
	}, [onStateChange, state]);

	const MetadataComponent = isMetadataTemplateField ? MetadataTemplateFieldValueInput : Metadata;

	return (
		<MetadataComponent
			errorMessage={undefined}
			fieldConfig={{ options: state.options }}
			fieldType="MULTI_SELECTION"
			isDisabled={false}
			label="Value"
			onBlur={() => {}}
			onChange={(value) => {
				if (value.fieldType !== 'MULTI_SELECTION' || value.value === null || typeof value.value === 'string') {
					return;
				}

				setState({
					options: value.value.options,
					selectedValues: value.value.selectedValues,
				});
			}}
			value={state.selectedValues}
		/>
	);
}

async function expectCheckboxChecked(screen: RenderResult, index: number, expected: boolean) {
	const checkbox = screen.getByRole('checkbox', { name: `Option ${index}` });
	if (expected) {
		await expect.element(checkbox).toBeChecked();
		return;
	}
	await expect.element(checkbox).not.toBeChecked();
}

async function expectSelectOptionSelected(screen: RenderResult, option: string, expected: boolean) {
	const optionElement = screen.getByRole('option', { name: option });
	if (expected) {
		await expect.element(optionElement).toHaveAttribute('aria-selected', 'true');
		return;
	}

	await expect.element(optionElement).not.toHaveAttribute('aria-selected', 'true');
}

describe('Metadata selection editor', () => {
	it('keeps all radios unselected when default option is off while adding and typing', async () => {
		const screen = await render(
			<MetadataSelectionHarness initialOptions={['1', '2', '3']} initialSelectedValue={null} />,
		);

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 2, false);
		await expectRadioChecked(screen, 3, false);

		await screen.getByRole('button', { name: 'Add Option' }).click();
		await screen.getByRole('textbox', { name: 'Option 4 value' }).fill('4');

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 2, false);
		await expectRadioChecked(screen, 3, false);
		await expectRadioChecked(screen, 4, false);
	});

	it('does not jump selected radio when editing a selected option to a duplicate value', async () => {
		const screen = await render(
			<MetadataSelectionHarness initialOptions={['1', '2', '3']} initialSelectedValue={'3'} />,
		);

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 3, true);

		const optionThreeInput = screen.getByRole('textbox', { name: 'Option 3 value' });
		await optionThreeInput.clear();
		await optionThreeInput.fill('1');

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 3, true);
	});

	it('shows inline duplicate option errors for trimmed duplicate values', async () => {
		const screen = await render(
			<MetadataSelectionHarness initialOptions={['Option A', 'Option B']} initialSelectedValue={'Option A'} />,
		);

		const optionTwoInput = screen.getByRole('textbox', { name: 'Option 2 value' });
		await optionTwoInput.fill(' Option A ');

		await expect
			.poll(
				() =>
					Array.from(screen.baseElement.querySelectorAll('[slot="errorMessage"]')).filter((errorNode) =>
						errorNode.textContent?.includes(METADATA_OPTION_DUPLICATE_VALUE_MESSAGE),
					).length,
			)
			.toBeGreaterThanOrEqual(2);
	});

	it('allows case-variant values without duplicate errors', async () => {
		const screen = await render(
			<MetadataSelectionHarness initialOptions={['Option A', 'Option B']} initialSelectedValue={'Option A'} />,
		);

		const optionTwoInput = screen.getByRole('textbox', { name: 'Option 2 value' });
		await optionTwoInput.fill('option a');

		expect(screen.baseElement.textContent).not.toContain(METADATA_OPTION_DUPLICATE_VALUE_MESSAGE);
	});

	it('shows inline errors for whitespace-only option values', async () => {
		const screen = await render(
			<MetadataSelectionHarness initialOptions={['Option A', 'Option B']} initialSelectedValue={'Option A'} />,
		);

		const optionTwoInput = screen.getByRole('textbox', { name: 'Option 2 value' });
		await optionTwoInput.fill('   ');

		await expect.element(screen.getByText(METADATA_OPTION_INVALID_VALUE_MESSAGE)).toBeInTheDocument();
	});

	it('clears selected value when default option set is toggled off', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue={'2'}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByText('Default option set').click();

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 2, false);
		await expectRadioChecked(screen, 3, false);
		await expect.poll(() => latestState?.selectedValue).toBe(null);
	});

	it('restores the previous selected option when toggled back on', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue={'2'}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		const toggle = screen.getByText('Default option set');
		await toggle.click();
		await toggle.click();

		await expectRadioChecked(screen, 1, false);
		await expectRadioChecked(screen, 2, true);
		await expectRadioChecked(screen, 3, false);
		await expect.poll(() => latestState?.selectedValue).toBe('2');
	});

	it('falls back to first option when removing the selected option', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue={'2'}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: 'Remove option 2' }).click();

		await expectRadioChecked(screen, 1, true);
		await expectRadioChecked(screen, 2, false);
		await expect.poll(() => latestState?.selectedValue).toBe('1');
	});
});

describe('Metadata multi-selection editor', () => {
	it('keeps all checkboxes unselected when default option is off while adding and typing', async () => {
		const screen = await render(
			<MetadataMultiSelectionHarness initialOptions={['1', '2', '3']} initialSelectedValues={null} />,
		);

		await expectCheckboxChecked(screen, 1, false);
		await expectCheckboxChecked(screen, 2, false);
		await expectCheckboxChecked(screen, 3, false);

		await screen.getByRole('button', { name: 'Add Option' }).click();
		await screen.getByRole('textbox', { name: 'Option 4 value' }).fill('4');

		await expectCheckboxChecked(screen, 1, false);
		await expectCheckboxChecked(screen, 2, false);
		await expectCheckboxChecked(screen, 3, false);
		await expectCheckboxChecked(screen, 4, false);
	});

	it('does not jump selected checkbox when editing a selected option to a duplicate value', async () => {
		const screen = await render(
			<MetadataMultiSelectionHarness initialOptions={['1', '2', '3']} initialSelectedValues={['3']} />,
		);

		await expectCheckboxChecked(screen, 1, false);
		await expectCheckboxChecked(screen, 3, true);

		const optionThreeInput = screen.getByRole('textbox', { name: 'Option 3 value' });
		await optionThreeInput.clear();
		await optionThreeInput.fill('1');

		await expectCheckboxChecked(screen, 1, false);
		await expectCheckboxChecked(screen, 3, true);
	});

	it('shows inline duplicate option errors in multi-selection editor', async () => {
		const screen = await render(
			<MetadataMultiSelectionHarness initialOptions={['Option A', 'Option B']} initialSelectedValues={['Option B']} />,
		);

		const optionTwoInput = screen.getByRole('textbox', { name: 'Option 2 value' });
		await optionTwoInput.fill(' Option A ');

		await expect
			.poll(
				() =>
					Array.from(screen.baseElement.querySelectorAll('[slot="errorMessage"]')).filter((errorNode) =>
						errorNode.textContent?.includes(METADATA_OPTION_DUPLICATE_VALUE_MESSAGE),
					).length,
			)
			.toBeGreaterThanOrEqual(2);
	});

	it('clears selected values when default option set is toggled off', async () => {
		let latestState: MultiSelectionState | undefined;

		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={['1', '3']}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByText('Default option set').click();

		await expectCheckboxChecked(screen, 1, false);
		await expectCheckboxChecked(screen, 2, false);
		await expectCheckboxChecked(screen, 3, false);
		await expect.poll(() => latestState?.selectedValues).toBe(null);
	});

	it('restores the previous selected options when toggled back on', async () => {
		let latestState: MultiSelectionState | undefined;

		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={['1', '3']}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		const toggle = screen.getByText('Default option set');
		await toggle.click();
		await toggle.click();

		await expectCheckboxChecked(screen, 1, true);
		await expectCheckboxChecked(screen, 2, false);
		await expectCheckboxChecked(screen, 3, true);
		await expect.poll(() => sortStrings(latestState?.selectedValues)).toEqual(['1', '3']);
	});

	it('falls back to first option when removing all selected options', async () => {
		let latestState: MultiSelectionState | undefined;

		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={['2']}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: 'Remove option 2' }).click();

		await expectCheckboxChecked(screen, 1, true);
		await expectCheckboxChecked(screen, 2, false);
		await expect.poll(() => latestState?.selectedValues).toEqual(['1']);
	});
});

describe('Metadata template single-selection editor', () => {
	it('does not auto-select the first option when initial value is empty', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue={null}
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await expect.element(screen.getByText('Select value')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Value' }).click();

		await expectSelectOptionSelected(screen, '1', false);
		await expectSelectOptionSelected(screen, '2', false);
		await expect.poll(() => latestState?.selectedValue).toBe(null);
	});

	it('selects the first option normally from an empty state', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue={null}
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: 'Value' }).click();
		await screen.getByRole('option', { name: '1' }).click();

		await expect.poll(() => latestState?.selectedValue).toBe('1');
	});

	it('renders stale values as empty without mutating them to the first option', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue="Missing"
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await expect.element(screen.getByText('Select value')).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Value' }).click();

		await expectSelectOptionSelected(screen, '1', false);
		await expectSelectOptionSelected(screen, '2', false);
		await expect.poll(() => latestState?.selectedValue).toBe('Missing');
	});

	it('allows clearing a selected option by selecting it again', async () => {
		let latestState: SelectionState | undefined;

		const screen = await render(
			<MetadataSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValue="2"
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: /Value/ }).click();
		await screen.getByRole('option', { name: '2' }).click();

		await expect.element(screen.getByText('Select value')).toBeInTheDocument();
		await expect.poll(() => latestState?.selectedValue).toBe(null);
	});
});

describe('Metadata template multi-selection editor', () => {
	it('renders with Select UI instead of checkbox list', async () => {
		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={['2']}
				isMetadataTemplateField
			/>,
		);

		await expect.element(screen.getByRole('button', { name: 'Value' })).toBeInTheDocument();
		await screen.getByRole('button', { name: 'Value' }).click();
		await expect.element(screen.getByRole('option', { name: '1' })).toBeInTheDocument();
		await expect.element(screen.getByRole('option', { name: '2' })).toBeInTheDocument();
	});

	it('does not auto-select the first option when initial value is empty', async () => {
		let latestState: MultiSelectionState | undefined;

		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={null}
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: 'Value' }).click();

		const firstOption = screen.getByRole('option', { name: '1' });
		await expect.element(firstOption).not.toHaveAttribute('aria-selected', 'true');
		await expect.poll(() => latestState?.selectedValues).toBe(null);
	});

	it('allows clearing all selected options', async () => {
		let latestState: MultiSelectionState | undefined;

		const screen = await render(
			<MetadataMultiSelectionHarness
				initialOptions={['1', '2', '3']}
				initialSelectedValues={['1', '2']}
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		await screen.getByRole('button', { name: 'Value' }).click();
		await screen.getByRole('option', { name: '1' }).click();
		await screen.getByRole('option', { name: '2' }).click();

		await expect.poll(() => latestState?.selectedValues).toBe(null);
	});
});
