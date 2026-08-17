'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';

function InfoRow({ label, value }: { readonly label: string; readonly value: string | undefined }) {
	return (
		<div className="flex flex-col gap-1">
			<dt className="text-base-label-sm text-base-neutral-600 dark:text-base-neutral-300">{label}</dt>
			<dd className="text-base-sm">{value ?? '-'}</dd>
		</div>
	);
}

export function AccountInfoTab() {
	const { currentUserData } = useCurrentUser();

	const groups = currentUserData?.groups?.map((group) => group.name).join(', ');
	const authProvider = currentUserData?.authentication_provider === 'SHIBBOLETH' ? 'Shibboleth' : 'Application';

	return (
		<dl className="flex flex-col gap-6">
			<InfoRow label="Username" value={currentUserData?.username} />
			<InfoRow label="Email" value={currentUserData?.email} />
			<InfoRow label="Full name" value={currentUserData?.full_name} />
			<InfoRow label="Groups" value={groups} />
			<InfoRow label="Authentication provider" value={authProvider} />
		</dl>
	);
}
