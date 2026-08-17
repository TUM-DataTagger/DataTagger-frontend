import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
	Metadata,
	MetadataTemplateFieldDefinitionInput,
	MetadataTemplateFieldValueInput,
	MetadataValue,
} from '@/components/Metadata';
import { METADATA_OPTION_DUPLICATE_VALUE_MESSAGE } from '@/util/metadataOptionValidation';

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => true),
}));

type TagState = {
	readonly options: string[];
	readonly selectedValues: string[] | null;
};

function MetadataTagHarness({
	initialOptions,
	initialSelectedValues,
	isMetadataTemplateField,
	onStateChange,
}: {
	readonly initialOptions: string[];
	readonly initialSelectedValues: string[] | null;
	readonly isMetadataTemplateField: boolean;
	readonly onStateChange?: ((state: TagState) => void) | undefined;
}) {
	const [state, setState] = useState<TagState>({
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
			fieldType="TAG"
			isDisabled={false}
			label="Value"
			onBlur={() => {}}
			onChange={(value) => {
				if (value.fieldType !== 'TAG' || value.value === null || typeof value.value === 'string') {
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

function sortStrings(values: string[] | null | undefined): string[] {
	if (!values) {
		return [];
	}

	return [...values].sort((first, second) => first.localeCompare(second));
}

function MetadataTagDefinitionHarness(props: {
	readonly initialOptions: string[];
	readonly initialSelectedValues: string[] | null;
}) {
	const [state, setState] = useState<TagState>({
		options: props.initialOptions,
		selectedValues: props.initialSelectedValues,
	});

	return (
		<MetadataTemplateFieldDefinitionInput
			errorMessage={undefined}
			fieldConfig={{ options: state.options }}
			fieldType="TAG"
			isDisabled={false}
			label="Value"
			onBlur={() => {}}
			onChange={(value) => {
				if (value.fieldType !== 'TAG' || value.value === null || typeof value.value === 'string') {
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

describe('Metadata TAG editor', () => {
	it('supports template-backed tag selection with preselected values', async () => {
		let latestState: TagState | undefined;

		const screen = await render(
			<MetadataTagHarness
				initialOptions={['Checked tag #1', 'Checked tag #2', 'Label']}
				initialSelectedValues={['Checked tag #1']}
				isMetadataTemplateField
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		expect(screen.baseElement.querySelector('input[type="text"]')).toBeNull();
		await expect.element(screen.getByText('Label')).toBeInTheDocument();
		await screen.getByText('Checked tag #2').click();
		await expect.poll(() => sortStrings(latestState?.selectedValues)).toEqual(['Checked tag #1', 'Checked tag #2']);
	});

	it('supports manual add/select/remove tag flow and emits normalized values', async () => {
		let latestState: TagState | undefined;

		const screen = await render(
			<MetadataTagHarness
				initialOptions={['Tag #1', 'Tag #2']}
				initialSelectedValues={['Tag #1']}
				isMetadataTemplateField={false}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		const input = screen.getByRole('textbox', { name: 'Value' });
		await input.fill('Tag #3');
		input.element().dispatchEvent(
			new KeyboardEvent('keydown', {
				bubbles: true,
				key: 'Enter',
			}),
		);

		await expect.poll(() => latestState?.options).toEqual(['Tag #1', 'Tag #2', 'Tag #3']);
		await expect.poll(() => sortStrings(latestState?.selectedValues)).toEqual(['Tag #1', 'Tag #3']);

		await screen.getByRole('gridcell', { name: /^Tag #2/ }).click();
		await expect.poll(() => sortStrings(latestState?.selectedValues)).toEqual(['Tag #1', 'Tag #2', 'Tag #3']);

		const removeButtons = Array.from(screen.baseElement.querySelectorAll('button[slot="remove"]'));
		const lastRemoveButton = removeButtons.at(-1);
		lastRemoveButton?.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true,
			}),
		);
		await expect.poll(() => latestState?.options).toEqual(['Tag #1', 'Tag #2']);
		await expect.poll(() => sortStrings(latestState?.selectedValues)).toEqual(['Tag #1', 'Tag #2']);
	});

	it('shows duplicate option errors in tag field definition mode', async () => {
		const screen = await render(
			<MetadataTagDefinitionHarness initialOptions={['Tag #1', 'Tag #2']} initialSelectedValues={['Tag #2']} />,
		);

		const optionTwoInput = screen.getByRole('textbox', { name: 'Option 2 value' });
		await optionTwoInput.fill(' Tag #1 ');

		await expect
			.poll(
				() =>
					Array.from(screen.baseElement.querySelectorAll('[slot="errorMessage"]')).filter((errorNode) =>
						errorNode.textContent?.includes(METADATA_OPTION_DUPLICATE_VALUE_MESSAGE),
					).length,
			)
			.toBeGreaterThanOrEqual(2);
	});

	it('preserves padded legacy tag identities until an explicit save boundary', async () => {
		let latestState: TagState | undefined;
		const screen = await render(
			<MetadataTagHarness
				initialOptions={['A', ' A ']}
				initialSelectedValues={[' A ']}
				isMetadataTemplateField={false}
				onStateChange={(state) => {
					latestState = state;
				}}
			/>,
		);

		const matchingTags = screen.getByRole('gridcell', { name: /^A/ }).all();
		await expect.poll(() => matchingTags.length).toBe(2);
		await matchingTags[0]!.click();
		await expect.poll(() => latestState).toEqual({ options: ['A', ' A '], selectedValues: [' A ', 'A'] });
	});

	it('renders read-only TAG metadata as selected tags only', async () => {
		const screen = await render(
			<MetadataValue
				field={
					{
						config: { options: ['Checked tag #1', 'Checked tag #2', 'Unchecked tag'] },
						custom_key: 'Tag labels',
						field_type: 'TAG',
						mandatory: false,
						order: 1,
						pk: 'tag-field',
						value: ['Checked tag #1', 'Checked tag #2'],
					} as any
				}
			/>,
		);

		await expect.element(screen.getByText('Checked tag #1')).toBeInTheDocument();
		await expect.element(screen.getByText('Checked tag #2')).toBeInTheDocument();
		expect(screen.baseElement.textContent).not.toContain('Unchecked tag');
	});

	it('renders read-only TAG metadata with all options when showAllOptions is enabled', async () => {
		const screen = await render(
			<MetadataValue
				field={
					{
						config: { options: ['Checked tag #1', 'Checked tag #2', 'Unchecked tag'] },
						custom_key: 'Tag labels',
						field_type: 'TAG',
						mandatory: false,
						order: 1,
						pk: 'tag-field',
						value: ['Checked tag #1', 'Checked tag #2'],
					} as any
				}
				showAllOptions
			/>,
		);

		await expect.element(screen.getByText('Checked tag #1')).toBeInTheDocument();
		await expect.element(screen.getByText('Checked tag #2')).toBeInTheDocument();
		await expect.element(screen.getByText('Unchecked tag')).toBeInTheDocument();
	});
});
