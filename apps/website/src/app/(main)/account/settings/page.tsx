import { redirect } from 'next/navigation';
import type { Metadata } from 'next/types';
import { userSettingsEnabledFlag } from '@/flags';
import { AccountSettingsContent } from './AccountSettingsContent';

export const metadata: Metadata = {
	title: 'Settings',
};

export default async function Page() {
	if (!(await userSettingsEnabledFlag())) {
		redirect('/projects');
	}
	return (
		<div className="flex w-full grow md:px-8 md:py-8 xl:px-[132px]">
			<AccountSettingsContent />
		</div>
	);
}
