'use client';

import { useQuery } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';

export function useCurrentUser() {
	const { data: currentUserData } = useQuery($api.queryOptions('get', '/api/v1/user/me/'));

	return { currentUserData };
}
