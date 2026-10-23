'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Description, Label } from '@/components/ui/Field';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { TextField } from '@/components/ui/TextField';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';

const connectionQueryOptions = $api.queryOptions('get', '/api/v1/elabftw/connection/', {}, { retry: false });

export function ElabftwSettingsForm() {
	const queryClient = useQueryClient();
	const { data: connection, isPending } = useQuery(connectionQueryOptions);

	const [url, setUrl] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [verifyTls, setVerifyTls] = useState(true);
	const [testResult, setTestResult] = useState<{ readonly message: string; readonly ok: boolean } | null>(null);

	useEffect(() => {
		if (connection) {
			setUrl(connection.url);
			setVerifyTls(connection.verify_tls ?? true);
		}
	}, [connection]);

	const runTest = async () => {
		const { data, error, response } = await openAPIClient.POST('/api/v1/elabftw/connection/test/');

		setTestResult(
			error || !data
				? { ok: false, message: formatErrorMessage(error, response) }
				: { ok: true, message: `Connected to eLabFTW as ${data.fullname || data.email || 'your account'}.` },
		);
	};

	const save = useMutation({
		mutationFn: async () => {
			const { error, response } = await openAPIClient.PUT('/api/v1/elabftw/connection/', {
				body: { url, verify_tls: verifyTls, ...(apiKey ? { api_key: apiKey } : {}) },
			});

			if (error) {
				throw new Error(formatErrorMessage(error, response));
			}
		},
		async onSuccess() {
			setApiKey('');
			await queryClient.invalidateQueries({ queryKey: connectionQueryOptions.queryKey });
			// Check the new settings right away
			await runTest();
		},
	});

	const test = useMutation({ mutationFn: runTest });

	const disconnect = useMutation({
		mutationFn: async () => {
			await openAPIClient.DELETE('/api/v1/elabftw/connection/');
		},
		async onSuccess() {
			setUrl('');
			setApiKey('');
			setVerifyTls(true);
			setTestResult(null);
			queryClient.removeQueries({ queryKey: connectionQueryOptions.queryKey });
			await queryClient.invalidateQueries({ queryKey: connectionQueryOptions.queryKey });
		},
	});

	if (isPending) {
		return <Loader2Icon aria-label="Loading" className="animate-spin" size={24} strokeWidth={1.5} />;
	}

	const isBusy = save.isPending || test.isPending || disconnect.isPending;

	return (
		<Form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				setTestResult(null);
				save.mutate();
			}}
		>
			{save.error ? (
				<Alert>
					<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					{save.error.message}
				</Alert>
			) : null}

			{testResult ? (
				<Alert variant={testResult.ok ? 'info' : 'error'}>
					{testResult.ok ? (
						<CheckCircle2Icon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					) : (
						<AlertCircleIcon aria-hidden className="shrink-0" size={24} strokeWidth={1.5} />
					)}
					{testResult.message}
				</Alert>
			) : null}

			<TextField autoComplete="url" isRequired onChange={setUrl} type="url" value={url}>
				<Label>eLabFTW address</Label>
				<Input placeholder="https://elabftw.example.org" />
				<Description>The address you open eLabFTW with in your browser.</Description>
			</TextField>

			<TextField
				autoComplete="off"
				isRequired={!connection?.has_api_key}
				onChange={setApiKey}
				type="password"
				value={apiKey}
			>
				<Label>API key</Label>
				<Input placeholder={connection?.has_api_key ? 'Saved – leave empty to keep it' : 'Paste your API key'} />
			</TextField>

			<Checkbox isSelected={verifyTls} onChange={setVerifyTls}>
				Verify the HTTPS certificate of eLabFTW
			</Checkbox>
			{verifyTls ? null : (
				<p className="-mt-4 text-base-sm text-base-neutral-600 dark:text-base-neutral-300">
					Only turn this off for an internal eLabFTW with a self-signed certificate.
				</p>
			)}

			<div className="flex flex-wrap gap-2">
				<Button isDisabled={isBusy} type="submit" variant="filled">
					{save.isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
					Save
				</Button>
				{connection ? (
					<>
						<Button
							isDisabled={isBusy}
							onPress={() => {
								setTestResult(null);
								test.mutate();
							}}
							variant="secondary-outline"
						>
							{test.isPending ? <Loader2Icon aria-hidden className="animate-spin" size={18} strokeWidth={1.5} /> : null}
							Test connection
						</Button>
						<Button isDisabled={isBusy} onPress={() => disconnect.mutate()} variant="secondary-discreet">
							Disconnect
						</Button>
					</>
				) : null}
			</div>
		</Form>
	);
}
