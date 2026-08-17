import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { BulkEditFillInTemplateFieldsButton, BulkEditMoreButton } from '@/components/BulkEditFilesToolbar';
import {
	BulkFillMetadataTemplateFieldsDialog,
	BulkFillMetadataTemplateFieldsFlow,
	type BulkFillMetadataTemplateFieldsPreflightResponse,
} from '@/components/BulkFillMetadataTemplateFields';
import type * as ToastModule from '@/components/ui/Toast';

const nuqsState = vi.hoisted(() => ({
	queryStates: {
		selected: ['dataset-1', 'dataset-2', 'dataset-3', 'dataset-4'],
	} as Record<string, unknown>,
	setQueryStates: vi.fn(async (_nextValue: Record<string, unknown>) => {}),
}));

const apiState = vi.hoisted(() => ({
	postMock: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
	add: vi.fn(),
}));

vi.mock('nuqs', async () => {
	const React = await import('react');

	return {
		parseAsArrayOf: () => ({
			withDefault: (defaultValue: string[]) => ({ defaultValue }),
		}),
		parseAsBoolean: {
			withDefault: (defaultValue: boolean) => ({ defaultValue }),
		},
		parseAsString: {
			withDefault: (defaultValue: string) => ({ defaultValue }),
		},
		useQueryState: (_queryKey: string, parser?: { readonly defaultValue?: unknown }) => {
			const [value, setValue] = React.useState(parser?.defaultValue ?? null);
			return [value, setValue] as const;
		},
		useQueryStates: (schema: Record<string, { readonly defaultValue?: unknown }>) => {
			const initialValue = Object.fromEntries(
				Object.entries(schema).map(([key, parser]) => [key, nuqsState.queryStates[key] ?? parser.defaultValue ?? null]),
			);
			const [state, setState] = React.useState<Record<string, unknown>>(initialValue);

			return [
				state,
				async (nextValue: Record<string, unknown>) => {
					void nuqsState.setQueryStates(nextValue);
					setState((currentValue) => ({
						...currentValue,
						...nextValue,
					}));
				},
			] as const;
		},
	};
});

vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock('@/util/clientFetch', () => ({
	$api: {
		queryOptions: (method: string, path: string, options?: { readonly params?: unknown }) => ({
			queryKey: [method, path, options?.params ?? null],
		}),
	},
	openAPIClient: {
		POST: (...args: unknown[]) => apiState.postMock(...args),
	},
}));

vi.mock('@/components/ui/Toast', async () => {
	const actual = await vi.importActual<typeof ToastModule>('@/components/ui/Toast');

	return {
		...actual,
		globalToastQueue: {
			add: toastState.add,
		},
	};
});

const preflightResponse: BulkFillMetadataTemplateFieldsPreflightResponse = {
	eligible_uploads_datasets: [
		{ base_version_pk: 'base-version-1', display_name: 'Dataset One', pk: 'dataset-1' },
		{ base_version_pk: 'base-version-2', display_name: 'Dataset Two', pk: 'dataset-2' },
	],
	fields: [
		{
			config: { description: 'Describe the sampling approach used.' },
			custom_key: 'Sampling method',
			field: null,
			field_type: 'TEXT',
			mandatory: true,
			metadata_template: {
				created_by: {
					email: 'jane@example.com',
					full_name: 'Jane Doe',
					pk: 1,
					username: 'jane',
				},
				creation_date: '2026-03-26T08:00:00Z',
				last_modification_date: '2026-03-26T08:00:00Z',
				last_modified_by: {
					email: 'jane@example.com',
					full_name: 'Jane Doe',
					pk: 1,
					username: 'jane',
				},
				name: 'Folder template v1',
				pk: 'template-version-1',
				metadata_template_container: {
					assigned_to_content_object_name: 'Folder Alpha',
					name: 'Folder template',
					pk: 'template-container-1',
					project: {
						name: 'Project One',
						pk: 'project-1',
					},
				},
			},
			order: 1,
			pk: 'field-1',
			previous_version_field: null,
			value: 'Simple random sampling',
			various_inputs: false,
		},
		{
			config: {
				options: ['A', 'B', 'C'],
			},
			custom_key: 'Group',
			field: null,
			field_type: 'SELECTION',
			mandatory: false,
			metadata_template: {
				created_by: {
					email: 'jane@example.com',
					full_name: 'Jane Doe',
					pk: 1,
					username: 'jane',
				},
				creation_date: '2026-03-26T08:00:00Z',
				last_modification_date: '2026-03-26T08:00:00Z',
				last_modified_by: {
					email: 'jane@example.com',
					full_name: 'Jane Doe',
					pk: 1,
					username: 'jane',
				},
				name: 'Folder template v1',
				pk: 'template-version-1',
				metadata_template_container: {
					assigned_to_content_object_name: 'Folder Alpha',
					name: 'Folder template',
					pk: 'template-container-1',
					project: {
						name: 'Project One',
						pk: 'project-1',
					},
				},
			},
			order: 2,
			pk: 'field-2',
			previous_version_field: null,
			value: 'A',
			various_inputs: true,
		},
	],
	has_skipped_due_to_pending_template_upgrade: true,
	skip_reasons: [{ code: 'PENDING_TEMPLATE_UPGRADE', count: 2 }],
	skipped_uploads_datasets_count: 2,
	warnings: [],
};

const baseTextField = preflightResponse.fields[0]!;
const baseSelectionField = preflightResponse.fields[1]!;

const fileLevelPreflightResponse: BulkFillMetadataTemplateFieldsPreflightResponse = {
	...preflightResponse,
	fields: [
		...preflightResponse.fields,
		{
			...baseTextField,
			custom_key: 'File-level comment',
			metadata_template: {
				...baseTextField.metadata_template,
				name: 'File-level template v1',
				pk: 'template-version-file-level',
				metadata_template_container: {
					...baseTextField.metadata_template.metadata_template_container,
					assigned_to_content_object_name: 'Dataset One',
					name: 'File-level template',
					pk: 'template-container-file-level',
				},
			},
			order: 3,
			pk: 'field-file-level-comment',
			value: 'Ready for review',
			various_inputs: false,
		},
	],
	has_skipped_due_to_pending_template_upgrade: false,
	skip_reasons: [],
	skipped_uploads_datasets_count: 0,
	warnings: [],
};

const differentFileLevelTemplatesPreflightResponse: BulkFillMetadataTemplateFieldsPreflightResponse = {
	...preflightResponse,
	fields: [baseTextField],
	has_skipped_due_to_pending_template_upgrade: false,
	skip_reasons: [],
	skipped_uploads_datasets_count: 0,
	warnings: [{ code: 'DIFFERENT_DATASET_METADATA_TEMPLATES' }],
};

const variedValuePreflightResponse: BulkFillMetadataTemplateFieldsPreflightResponse = {
	...preflightResponse,
	fields: [
		{
			...baseTextField,
			config: { description: 'Whole number value.' },
			custom_key: 'Integer field',
			field_type: 'INTEGER',
			pk: 'field-integer',
			value: null,
			various_inputs: true,
		},
		{
			...baseSelectionField,
			config: {
				description: 'Here you should select the correct amount of items that are relevant',
				options: ['1', '2', '3'],
			},
			custom_key: 'Multi-select field',
			field_type: 'MULTI_SELECTION',
			pk: 'field-multi-selection',
			value: null,
			various_inputs: true,
		},
	],
};

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

function BulkFillMetadataTemplateFieldsFlowHarness(props: {
	readonly folderUuid?: string;
	readonly selected: string[];
}) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<BulkFillMetadataTemplateFieldsFlow
			folderUuid={props.folderUuid}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			selected={props.selected}
		/>
	);
}

describe('Bulk fill metadata template fields flow', () => {
	beforeEach(() => {
		apiState.postMock.mockReset();
		toastState.add.mockReset();
		nuqsState.queryStates = {
			selected: ['dataset-1', 'dataset-2', 'dataset-3', 'dataset-4'],
		};
		nuqsState.setQueryStates.mockClear();
	});

	it('renders inherited fields and keeps various-input fields unchecked by default', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsDialog
					data={preflightResponse}
					isOpen
					onOpenChange={() => {}}
					selected={preflightResponse.eligible_uploads_datasets}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByRole('dialog', { name: 'Fill-in metadata template fields' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
		await expect
			.element(
				screen.getByText(
					'The filled-in values will be applied to all selected files. Previous values will be overwritten.',
				),
			)
			.toBeInTheDocument();
		await expect.element(screen.getByText('Total: 2 fields')).toBeInTheDocument();
		await expect.poll(() => screen.baseElement.textContent).toContain('Sampling method');
		await expect.poll(() => screen.baseElement.textContent).toContain('Group');

		const checkboxes = screen.baseElement.querySelectorAll('input[type="checkbox"]');
		expect(checkboxes).toHaveLength(3);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);
	});

	it('renders returned file-level fields and submits them with the selected fields', async () => {
		apiState.postMock
			.mockResolvedValueOnce({
				data: fileLevelPreflightResponse,
				error: null,
				response: new Response(null, { status: 200 }),
			})
			.mockResolvedValueOnce({
				data: { skipped_uploads_datasets_count: 0, updated_uploads_datasets_count: 2 },
				error: null,
				response: new Response(null, { status: 200 }),
			});

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsFlowHarness
					folderUuid="folder-1"
					selected={nuqsState.queryStates.selected as string[]}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByRole('dialog', { name: 'Fill-in metadata template fields' })).toBeInTheDocument();
		await expect.poll(() => screen.baseElement.textContent).toContain('File-level comment');
		await expect.poll(() => screen.baseElement.textContent).toContain('Total: 3 fields');

		await screen.getByRole('button', { name: 'Apply metadata' }).click();

		await vi.waitFor(() => {
			expect(apiState.postMock).toHaveBeenLastCalledWith(
				'/api/v1/uploads-dataset/bulk-fill-metadata-template-fields-submit/',
				{
					body: {
						targets: [
							{ base_version_pk: 'base-version-1', uploads_dataset_pk: 'dataset-1' },
							{ base_version_pk: 'base-version-2', uploads_dataset_pk: 'dataset-2' },
						],
						fields: [
							{ metadata_template_field_pk: 'field-1', value: 'Simple random sampling' },
							{ metadata_template_field_pk: 'field-file-level-comment', value: 'Ready for review' },
						],
					},
				},
			);
		});
	});

	it('disables apply when no fields are selected', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsDialog
					data={{
						...preflightResponse,
						fields: preflightResponse.fields.map((field) => ({
							...field,
							various_inputs: true,
						})),
					}}
					isOpen
					onOpenChange={() => {}}
					selected={preflightResponse.eligible_uploads_datasets}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByRole('dialog', { name: 'Fill-in metadata template fields' })).toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Apply metadata' })).toBeDisabled();
	});

	it('blocks trim-created choice collisions and trims valid values before applying', async () => {
		const invalidApply = vi.fn(async () => {});
		const invalidScreen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsDialog
					data={{
						...preflightResponse,
						fields: [
							{
								...baseSelectionField,
								config: { options: ['A', ' A '] },
								value: ' A ',
								various_inputs: false,
							},
						],
					}}
					isOpen
					onApply={invalidApply}
					onOpenChange={() => {}}
					selected={preflightResponse.eligible_uploads_datasets}
				/>
			</QueryClientProvider>,
		);
		await invalidScreen.getByRole('button', { name: 'Apply metadata' }).click();
		await expect.element(invalidScreen.getByText('Option values must be unique')).toBeVisible();
		expect(invalidApply).not.toHaveBeenCalled();
		await invalidScreen.unmount();

		const validApply = vi.fn(async () => {});
		const validScreen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsDialog
					data={{ ...preflightResponse, fields: [{ ...baseTextField, value: ' padded value ' }] }}
					isOpen
					onApply={validApply}
					onOpenChange={() => {}}
					selected={preflightResponse.eligible_uploads_datasets}
				/>
			</QueryClientProvider>,
		);
		await validScreen.getByRole('button', { name: 'Apply metadata' }).click();
		await vi.waitFor(() =>
			expect(validApply).toHaveBeenCalledWith(
				expect.objectContaining({ fields: [{ metadata_template_field_pk: 'field-1', value: 'padded value' }] }),
			),
		);
	});

	it('renders various-input integer fields without crashing', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsDialog
					data={variedValuePreflightResponse}
					isOpen
					onOpenChange={() => {}}
					selected={variedValuePreflightResponse.eligible_uploads_datasets}
				/>
			</QueryClientProvider>,
		);

		await expect.element(screen.getByRole('dialog', { name: 'Fill-in metadata template fields' })).toBeInTheDocument();
		await expect.poll(() => screen.baseElement.textContent).toContain('Integer field');
		await expect.poll(() => screen.baseElement.textContent).toContain('Multi-select field');
		await expect.element(screen.getByText('Whole number value.')).toBeInTheDocument();
		expect(screen.baseElement.textContent).not.toContain('This component has entered an erroneous state');
	});

	it('shows the upgrade warning inside the main dialog and Skip continues with eligible datasets only', async () => {
		apiState.postMock
			.mockResolvedValueOnce({
				data: preflightResponse,
				error: null,
				response: new Response(null, { status: 200 }),
			})
			.mockResolvedValueOnce({
				data: { skipped_uploads_datasets_count: 0, updated_uploads_datasets_count: 2 },
				error: null,
				response: new Response(null, { status: 200 }),
			});

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsFlowHarness
					folderUuid="folder-1"
					selected={nuqsState.queryStates.selected as string[]}
				/>
			</QueryClientProvider>,
		);

		await expect.poll(() => screen.baseElement.textContent).toContain('The bulk fill-in is limited');
		await expect.element(screen.getByRole('dialog', { name: 'Fill-in metadata template fields' })).toBeInTheDocument();
		await expect
			.element(screen.getByText('The bulk fill-in is limited to files without a pending metadata template upgrade.'))
			.toBeInTheDocument();
		await expect.element(screen.getByText(/2\s*files affected/)).toBeInTheDocument();

		await screen.getByRole('button', { name: 'Skip' }).click();

		await expect.poll(() => screen.baseElement.textContent).toContain('Fill-in metadata template fields');

		await screen.getByRole('button', { name: 'Apply metadata' }).click();

		await vi.waitFor(() => {
			expect(apiState.postMock).toHaveBeenLastCalledWith(
				'/api/v1/uploads-dataset/bulk-fill-metadata-template-fields-submit/',
				{
					body: {
						targets: [
							{ base_version_pk: 'base-version-1', uploads_dataset_pk: 'dataset-1' },
							{ base_version_pk: 'base-version-2', uploads_dataset_pk: 'dataset-2' },
						],
						fields: [{ metadata_template_field_pk: 'field-1', value: 'Simple random sampling' }],
					},
				},
			);
		});
	});

	it('shows a file-level template warning and Continue falls back to returned project or folder fields', async () => {
		apiState.postMock.mockResolvedValueOnce({
			data: differentFileLevelTemplatesPreflightResponse,
			error: null,
			response: new Response(null, { status: 200 }),
		});

		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkFillMetadataTemplateFieldsFlowHarness
					folderUuid="folder-1"
					selected={nuqsState.queryStates.selected as string[]}
				/>
			</QueryClientProvider>,
		);

		await expect.poll(() => screen.baseElement.textContent).toContain('shared project or folder fields');
		await expect
			.element(
				screen.getByText(
					'Not all selected files share the same file-level metadata template, so file-level fields cannot be filled together for this selection.',
				),
			)
			.toBeInTheDocument();
		expect(screen.baseElement.textContent).not.toContain('files affected');

		await screen.getByRole('button', { name: 'Continue' }).click();

		await expect.poll(() => screen.baseElement.textContent).toContain('Sampling method');
		await expect.poll(() => screen.baseElement.textContent).toContain('Total: 1 field');
	});

	it('renders fill-in template fields as a standalone bulk-edit button', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkEditFillInTemplateFieldsButton folderUuid="folder-1" />
			</QueryClientProvider>,
		);

		await expect.element(screen.getByRole('button', { name: 'Fill-in template fields' })).toBeInTheDocument();
	});

	it('removes fill-in template fields from the bulk edit menu', async () => {
		const screen = await render(
			<QueryClientProvider client={createQueryClient()}>
				<BulkEditMoreButton folderUuid="folder-1" />
			</QueryClientProvider>,
		);

		await screen.getByRole('button').click();

		expect(screen.baseElement.textContent).not.toContain('Fill-in template fields');
	});
});
