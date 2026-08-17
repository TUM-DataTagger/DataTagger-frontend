'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { EXPORT_POLL_INTERVAL_MS, triggerExportDownload } from '@/util/exportJobs';

export type ExportLifecycleJob = {
	readonly download_url?: string | null;
	readonly error_message?: string | null;
	readonly pk: string;
	readonly status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
};

type UseExportJobLifecycleOptions<Submission, Job extends ExportLifecycleJob> = {
	createJob(submission: Submission): Promise<Job>;
	readonly errorMessage: string;
	readonly isOpen?: boolean;
	onJobCreated?(job: Job): Promise<void> | void;
	onOpenChange?(isOpen: boolean): void;
	onReset?(): void;
	readonly queryKey: readonly unknown[];
	retrieveJob(jobId: string): Promise<Job>;
	readonly startedInBackgroundMessage?: string;
	readonly successMessage?: string;
};

export function useExportJobLifecycle<Submission, Job extends ExportLifecycleJob>({
	createJob,
	errorMessage,
	isOpen,
	onJobCreated,
	onOpenChange,
	onReset,
	queryKey,
	retrieveJob,
	startedInBackgroundMessage = 'Export started. You will receive an email when it is ready.',
	successMessage = 'Export is ready.',
}: UseExportJobLifecycleOptions<Submission, Job>) {
	const [jobId, setJobId] = useState<string | null>(null);
	const [jobErrorMessage, setJobErrorMessage] = useState<string | null>(null);
	const [submission, setSubmission] = useState<Submission | null>(null);
	const closeAfterCompletionRef = useRef(false);
	const handledTerminalJobIdRef = useRef<string | null>(null);
	const callbacksRef = useRef({ onJobCreated, onOpenChange, onReset });
	callbacksRef.current = { onJobCreated, onOpenChange, onReset };

	const createJobMutation = useMutation({
		mutationFn: createJob,
		async onSuccess(job) {
			setJobId(job.pk);
			await callbacksRef.current.onJobCreated?.(job);
		},
		onError(error) {
			setJobErrorMessage(error instanceof Error ? error.message : errorMessage);
		},
	});
	const resetCreateJobMutation = createJobMutation.reset;

	const jobQuery = useQuery({
		enabled: Boolean(isOpen && jobId),
		queryFn: async () => retrieveJob(jobId ?? ''),
		queryKey: [...queryKey, jobId],
		refetchInterval(query) {
			const status = (query.state.data as Job | undefined)?.status;
			return status === 'FINISHED' || status === 'ERROR' ? false : EXPORT_POLL_INTERVAL_MS;
		},
		refetchIntervalInBackground: false,
		retry: false,
	});

	const job = jobQuery.data;
	const isPreparing = Boolean(jobId && job?.status !== 'FINISHED' && job?.status !== 'ERROR');

	const reset = useCallback(() => {
		setJobId(null);
		setJobErrorMessage(null);
		setSubmission(null);
		resetCreateJobMutation();
		closeAfterCompletionRef.current = false;
		handledTerminalJobIdRef.current = null;
		callbacksRef.current.onReset?.();
	}, [resetCreateJobMutation]);

	useEffect(() => {
		if (!job || !jobId || handledTerminalJobIdRef.current === jobId) {
			return;
		}

		if (job.status === 'FINISHED') {
			handledTerminalJobIdRef.current = jobId;
			closeAfterCompletionRef.current = true;

			if (job.download_url) {
				triggerExportDownload(job.download_url);
			}

			globalToastQueue.add({ message: successMessage, type: ToastType.Success }, { timeout: 5_000 });
			callbacksRef.current.onOpenChange?.(false);
			reset();
			return;
		}

		if (job.status === 'ERROR') {
			handledTerminalJobIdRef.current = jobId;
			setJobErrorMessage(job.error_message ?? errorMessage);
		}
	}, [errorMessage, job, jobId, reset, successMessage]);

	const start = (nextSubmission: Submission) => {
		setSubmission(nextSubmission);
		setJobId(null);
		setJobErrorMessage(null);
		handledTerminalJobIdRef.current = null;
		createJobMutation.mutate(nextSubmission);
	};

	const retry = () => {
		if (submission) {
			start(submission);
		}
	};

	const handleOpenChange = (nextIsOpen: boolean) => {
		if (!nextIsOpen) {
			if (isPreparing && !closeAfterCompletionRef.current) {
				globalToastQueue.add({ message: startedInBackgroundMessage, type: ToastType.TextOnly }, { timeout: 5_000 });
			}

			reset();
		}

		callbacksRef.current.onOpenChange?.(nextIsOpen);
	};

	return {
		errorMessage: jobErrorMessage,
		handleOpenChange,
		isPreparing,
		isSubmitting: createJobMutation.isPending || isPreparing,
		job,
		retry,
		start,
		submission,
	};
}
