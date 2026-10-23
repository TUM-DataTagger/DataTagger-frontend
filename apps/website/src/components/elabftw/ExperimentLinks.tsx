'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	AlertCircleIcon,
	ExternalLinkIcon,
	FlaskConicalIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ModalOverlayProps } from 'react-aria-components';
import { useDebounceValue } from 'usehooks-ts';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input, InputGroup } from '@/components/ui/Input';
import { ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { cx } from '@/styles/cva';
import { buttonStyles } from '@/styles/ui/button';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import type { components } from '@/util/openapiSchema';

export type ExperimentLinkTargetType = components['schemas']['TargetTypeEnum'];
type ExperimentLink = components['schemas']['ExperimentLink'];
type ElabftwExperiment = components['schemas']['ElabftwExperiment'];

const ALL_LINKS_QUERY_KEY = ['get', '/api/v1/experiment-link/'];

function linksQueryOptions(targetType: ExperimentLinkTargetType, targetId: string) {
	return $api.queryOptions('get', '/api/v1/experiment-link/', {
		params: { query: { target_type: targetType, target_id: targetId } },
	});
}

const targetLabels: Readonly<Record<ExperimentLinkTargetType, string>> = {
	folder: 'folder',
	subfolder: 'subfolder',
	dataset: 'file',
};

export function ExperimentLinks(props: {
	readonly canEdit: boolean;
	readonly className?: string;
	readonly targetId: string;
	readonly targetType: ExperimentLinkTargetType;
}) {
	const queryClient = useQueryClient();
	const [isLinkOpen, setIsLinkOpen] = useState(false);
	const { data: links, isPending } = useQuery(linksQueryOptions(props.targetType, props.targetId));

	const { mutate: unlink, error: unlinkError } = useMutation({
		mutationFn: async (link: ExperimentLink) => {
			const { error, response } = await openAPIClient.DELETE('/api/v1/experiment-link/{id}/', {
				params: { path: { id: link.pk } },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ALL_LINKS_QUERY_KEY });
		},
	});

	if (isPending || (!links?.length && !props.canEdit)) {
		return null;
	}

	return (
		<section
			aria-label="eLabFTW experiments"
			className={cx('flex flex-wrap place-items-center gap-2 print:hidden', props.className)}
		>
			<span className="flex place-items-center gap-1.5 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
				<FlaskConicalIcon aria-hidden size={16} strokeWidth={1.5} />
				eLabFTW:
			</span>

			{links?.map((link) => (
				<span
					className={cx(
						'flex max-w-full place-items-center gap-1 rounded-full border py-0.5 pl-3 text-base-sm',
						link.inherited_from
							? 'border-dashed border-base-neutral-300 pr-3 dark:border-base-neutral-500'
							: 'border-base-lavender-200 bg-base-lavender-100/38 pr-1 dark:border-base-lavender-700 dark:bg-base-lavender-900/38',
					)}
					key={link.pk}
				>
					<a
						className="flex min-w-0 place-items-center gap-1.5 rounded-xs outline-0 outline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-base-lavender-400"
						href={link.experiment_url}
						rel="noreferrer noopener external"
						target="_blank"
						title={
							link.inherited_from
								? `Open experiment #${link.experiment_id} in eLabFTW (linked on ${targetLabels[link.inherited_from.target_type]} "${link.inherited_from.name}")`
								: `Open experiment #${link.experiment_id} in eLabFTW`
						}
					>
						<span className="text-base-neutral-600 dark:text-base-neutral-300">#{link.experiment_id}</span>
						<span className="max-w-[40ch] truncate">{link.title || 'Untitled experiment'}</span>
						<ExternalLinkIcon aria-hidden className="shrink-0" size={14} strokeWidth={1.5} />
						<span className="sr-only"> (opens eLabFTW in a new tab)</span>
					</a>
					{link.inherited_from ? (
						<span className="shrink-0 text-base-xs text-base-neutral-600 dark:text-base-neutral-300">
							via {link.inherited_from.name}
						</span>
					) : null}
					{props.canEdit && !link.inherited_from ? (
						<Button
							aria-label={`Remove link to experiment #${link.experiment_id}`}
							className="rounded-full p-1"
							onPress={() => unlink(link)}
							size="icon-sm"
							variant="discreet"
						>
							<XIcon aria-hidden size={14} strokeWidth={1.5} />
						</Button>
					) : null}
				</span>
			))}

			{props.canEdit ? (
				<Button onPress={() => setIsLinkOpen(true)} size="sm" variant="secondary-discreet">
					<PlusIcon aria-hidden size={16} strokeWidth={1.5} /> Link experiment
				</Button>
			) : null}

			{unlinkError ? <span className="text-base-sm text-base-sunset-600">{unlinkError.message}</span> : null}

			{isLinkOpen ? (
				<LinkExperimentDialog
					isOpen
					linkedIds={links?.map((link) => link.experiment_id) ?? []}
					onOpenChange={setIsLinkOpen}
					targetId={props.targetId}
					targetType={props.targetType}
				/>
			) : null}
		</section>
	);
}

function LinkExperimentDialog({
	linkedIds,
	targetId,
	targetType,
	...props
}: ModalOverlayProps & {
	readonly linkedIds: readonly number[];
	readonly targetId: string;
	readonly targetType: ExperimentLinkTargetType;
}) {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useDebounceValue('', 300);

	const { data: connection, isPending: isConnectionPending } = useQuery(
		$api.queryOptions('get', '/api/v1/elabftw/connection/', {}, { retry: false }),
	);

	const experimentsQuery = useQuery(
		$api.queryOptions(
			'get',
			'/api/v1/elabftw/experiments/',
			{ params: { query: { search: debouncedSearch } } },
			{ enabled: Boolean(connection), retry: false },
		),
	);

	const {
		mutate: link,
		error: linkError,
		variables: linkingExperiment,
		isPending: isLinking,
	} = useMutation({
		mutationFn: async (experiment: ElabftwExperiment) => {
			const { error, response } = await openAPIClient.POST('/api/v1/experiment-link/', {
				body: { target_type: targetType, target_id: targetId, experiment_id: experiment.id },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			// Keep the dialog open, so several experiments can be linked in a row
			await queryClient.invalidateQueries({ queryKey: ALL_LINKS_QUERY_KEY });
		},
	});

	// eLabFTW errors arrive as { error: "…" } with status 502, which the API schema doesn't describe
	const rawExperimentsError: unknown = experimentsQuery.error;
	const experimentsError = rawExperimentsError
		? formatErrorMessage(rawExperimentsError as Record<string, unknown>)
		: null;

	return (
		<ModalContent {...props} aria-label="Link eLabFTW experiment" size="2xl">
			<ModalHeader>Link eLabFTW experiments to this {targetLabels[targetType]}</ModalHeader>
			<ModalBody className="flex flex-col gap-4">
				<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					You can link several experiments.
					{targetType === 'dataset'
						? null
						: ` All files and subfolders inside this ${targetLabels[targetType]} get these links too.`}
				</p>
				{isConnectionPending ? null : connection ? (
					<>
						<TextField
							aria-label="Search experiments"
							autoFocus
							onChange={(value) => {
								setSearch(value);
								setDebouncedSearch(value);
							}}
							value={search}
						>
							<InputGroup>
								<SearchIcon aria-hidden data-slot="icon" size={18} strokeWidth={1.5} />
								<Input placeholder="Search by title or enter an experiment ID" />
							</InputGroup>
						</TextField>

						{linkError || experimentsError ? (
							<Alert>
								<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
								{linkError?.message ?? experimentsError}
							</Alert>
						) : null}

						{experimentsQuery.isFetching && !experimentsQuery.data ? (
							<span className="flex place-items-center gap-2 text-base-sm">
								<Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> Loading experiments…
							</span>
						) : null}

						{experimentsQuery.data ? (
							experimentsQuery.data.length ? (
								<ul className="flex max-h-96 flex-col gap-1 overflow-y-auto" aria-label="Experiments">
									{experimentsQuery.data.map((experiment) => {
										const isLinked = linkedIds.includes(experiment.id);

										return (
											<li key={experiment.id}>
												<Button
													className="flex w-full place-content-between place-items-center gap-4 rounded-lg px-3 py-2 text-left hover:bg-base-lavender-100/56 dark:hover:bg-base-lavender-900/56"
													isDisabled={isLinked || isLinking}
													onPress={() => link(experiment)}
													variant="unset"
												>
													<span className="flex min-w-0 flex-col">
														<span className="truncate text-base-label-md">
															{experiment.title || 'Untitled experiment'}
														</span>
														<span className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
															{[`#${experiment.id}`, experiment.date, experiment.category, experiment.status]
																.filter(Boolean)
																.join(' · ')}
														</span>
													</span>
													<span className="shrink-0 text-base-sm">
														{isLinked ? (
															'Linked'
														) : isLinking && linkingExperiment?.id === experiment.id ? (
															<Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} />
														) : (
															'Link'
														)}
													</span>
												</Button>
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-base-sm text-base-neutral-600 dark:text-base-neutral-300">No experiments found.</p>
							)
						) : null}
					</>
				) : (
					<Alert>
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
						<span>
							Connect your eLabFTW account first.{' '}
							<Link className="text-base-lavender-600 underline" href="/account/elabftw">
								Open eLabFTW settings
							</Link>
						</span>
					</Alert>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="filled">Done</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function OpenInElabftwLink(props: { readonly href: string }) {
	return (
		<a
			className={buttonStyles({ variant: 'secondary-outline', size: 'sm' })}
			href={props.href}
			rel="noreferrer noopener external"
			target="_blank"
		>
			Open in eLabFTW <ExternalLinkIcon aria-hidden size={16} strokeWidth={1.5} />
		</a>
	);
}
