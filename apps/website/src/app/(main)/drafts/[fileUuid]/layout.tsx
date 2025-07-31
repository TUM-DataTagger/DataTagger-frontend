import type { PropsWithChildren } from 'react';

export default async function Layout({ children }: PropsWithChildren) {
	return <div className="mx-auto w-full max-w-[852px] grow px-4 py-12 2xl:mx-0 2xl:max-w-none">{children}</div>;
}
