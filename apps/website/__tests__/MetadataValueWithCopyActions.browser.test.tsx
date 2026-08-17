import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import {
	MetadataFieldTypeBadge,
	MetadataTemplateFieldValueInput,
	MetadataValueWithCopyActions,
} from '@/components/Metadata';
import { MetadataTemplateFieldValueEditor } from '@/components/MetadataValueEditor';
import { FileMissingMetadataBadge } from '@/components/file-metadata/FileMetadataIndicators';

const { copySpy } = vi.hoisted(() => ({
	copySpy: vi.fn(async (_value: string) => true),
}));

vi.mock('@/hooks/useFeatureFlags', () => ({
	useFeatureFlags: () => ({
		data: {
			definitions: {},
			values: {},
		},
	}),
	isFeatureFlagEnabled: vi.fn(() => true),
}));

vi.mock('usehooks-ts', async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;

	return {
		...actual,
		useCopyToClipboard: () => [undefined, copySpy] as const,
	};
});

describe('MetadataValueWithCopyActions', () => {
	async function clickCopyButtonAndAssertValue(
		screen: Awaited<ReturnType<typeof render>>,
		buttonName: string,
		expectedValue: string,
	) {
		const copyButton = screen.getByRole('button', { name: buttonName });

		await expect.element(copyButton).toBeVisible();
		await copyButton.click();
		await expect.poll(() => copySpy.mock.calls.at(-1)?.[0]).toBe(expectedValue);
	}

	it('renders a readonly field type badge', async () => {
		const screen = await render(<MetadataFieldTypeBadge fieldType="SELECTION" />);

		await expect.element(screen.getByText('Single select')).toBeInTheDocument();
	});

	it('renders the shared missing metadata badge', async () => {
		const screen = await render(<FileMissingMetadataBadge />);

		await expect.element(screen.getByText('Missing metadata')).toBeInTheDocument();
	});

	it('copies scalar values', async () => {
		copySpy.mockClear();

		const screen = await render(
			<MetadataValueWithCopyActions
				field={
					{
						config: {},
						custom_key: 'Study title',
						field_type: 'TEXT',
						mandatory: false,
						order: 1,
						pk: 'text-field',
						value: 'Example title',
					} as const
				}
			/>,
		);

		await clickCopyButtonAndAssertValue(screen, 'Copy value', 'Example title');
	});

	it('renders copy buttons for single-select options while preserving selected state', async () => {
		copySpy.mockClear();

		const screen = await render(
			<MetadataValueWithCopyActions
				field={
					{
						config: { options: ['Simple random sampling', 'Systematic sampling'] },
						custom_key: 'Sampling technique',
						field_type: 'SELECTION',
						mandatory: false,
						order: 1,
						pk: 'selection-field',
						value: 'Simple random sampling',
					} as const
				}
			/>,
		);

		await expect.element(screen.getByText('Simple random sampling')).toBeInTheDocument();
		await expect.element(screen.getByText('Systematic sampling')).toBeInTheDocument();

		await clickCopyButtonAndAssertValue(screen, 'Copy option 2', 'Systematic sampling');
	});

	it('renders copy buttons for multi-select options', async () => {
		copySpy.mockClear();

		const screen = await render(
			<MetadataValueWithCopyActions
				field={
					{
						config: { options: ['Alpha', 'Beta', 'Gamma'] },
						custom_key: 'Labels',
						field_type: 'MULTI_SELECTION',
						mandatory: false,
						order: 1,
						pk: 'multi-selection-field',
						value: ['Alpha', 'Gamma'],
					} as const
				}
			/>,
		);

		await clickCopyButtonAndAssertValue(screen, 'Copy option 3', 'Gamma');
	});

	it('renders copy buttons for readonly tags without showing unselected options by default', async () => {
		copySpy.mockClear();

		const screen = await render(
			<MetadataValueWithCopyActions
				field={
					{
						config: { options: ['Checked tag', 'Unchecked tag'] },
						custom_key: 'Tags',
						field_type: 'TAG',
						mandatory: false,
						order: 1,
						pk: 'tag-field',
						value: ['Checked tag'],
					} as const
				}
			/>,
		);

		await expect.element(screen.getByText('Checked tag')).toBeInTheDocument();
		expect(screen.baseElement.textContent).not.toContain('Unchecked tag');

		await clickCopyButtonAndAssertValue(screen, 'Copy tag Checked tag', 'Checked tag');
	});
});

describe('MetadataTemplateFieldValueInput', () => {
	it('does not render the readonly type badge or copy actions in the regular template-field flow', async () => {
		const screen = await render(
			<MetadataTemplateFieldValueInput
				errorMessage={undefined}
				fieldConfig={{ options: ['Option A', 'Option B'] }}
				fieldType="SELECTION"
				isDisabled={false}
				label="Value"
				onBlur={() => {}}
				onChange={() => {}}
				value={null}
			/>,
		);

		expect(screen.baseElement.textContent).not.toContain('Single select');
		expect(screen.baseElement.querySelector('[aria-label^="Copy "]')).toBeNull();
	});

	it('passes className through the editor wrapper to the concrete field component', async () => {
		const screen = await render(
			<MetadataTemplateFieldValueEditor
				className="metadata-probe"
				configStrategy="preserve"
				errorMessage={undefined}
				fieldConfig={undefined}
				fieldType="TEXT"
				isDisabled={false}
				label="Value"
				onBlur={() => {}}
				onChange={() => {}}
				value=""
			/>,
		);

		expect(screen.baseElement.querySelector('.metadata-probe')).not.toBeNull();
	});
});
