'use server';

import { cookies } from 'next/headers';

export async function setFlag(key: string, value: string) {
	(await cookies()).set(key, value);
}
