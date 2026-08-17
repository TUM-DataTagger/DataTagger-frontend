import { os } from '@orpc/server';
import { cookies, headers } from 'next/headers';

/**
 * oRPC execution context providing access to Next.js request utilities.
 */
type ORPCContext = {
	readonly cookies: Awaited<ReturnType<typeof cookies>>;
	readonly headers: Awaited<ReturnType<typeof headers>>;
};

/**
 * Procedure builder with Next.js context (cookies/headers) already applied.
 * Use this as the base for all server actions.
 *
 * @example
 * ```ts
 * import { proc } from '@/server/proc';
 *
 * export const myAction = proc
 *   .handler(async ({ context }) => {
 *     context.cookies.set('key', 'value');
 *   })
 *   .actionable();
 * ```
 */
export const proc = os.use(async ({ next }) => {
	const ctx: ORPCContext = {
		cookies: await cookies(),
		headers: await headers(),
	};
	return next({ context: ctx });
});
