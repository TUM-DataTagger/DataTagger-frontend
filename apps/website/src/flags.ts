import { dedupe, flag } from 'flags/next';
import { openAPIClient } from '@/util/fetch';

const developerFlagDefinition = {
	key: 'is-developer',
	description: 'Enable developer toolbar',
	defaultValue: false,
	origin: '',
	identify: dedupe(async () => {
		try {
			const { data: currentUserData } = await openAPIClient.GET('/api/v1/user/me/');

			return { user: { email: currentUserData?.email } };
		} catch {
			return {};
		}
	}),
	decide({ entities }) {
		return entities?.user?.email ? /^[a-z]+@anexia(?:-it)?\.com$/.test(entities.user.email) : false;
	},
} satisfies Parameters<
	typeof flag<
		boolean,
		{
			user?: { email?: string | undefined } | undefined;
		}
	>
>[0];

export const developerFlag = flag<
	boolean,
	{
		user?: { email?: string | undefined } | undefined;
	}
>(developerFlagDefinition);
