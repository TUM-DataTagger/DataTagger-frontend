'use client';

import { atom, useAtomValue } from 'jotai';
import type { ComponentProps } from 'react';
import { EMAIL_REGEX } from 'valibot';

export const emailAtom = atom('account');

export function Email(props: ComponentProps<'span'>) {
	const email = useAtomValue(emailAtom);
	const isEmail = EMAIL_REGEX.test(email);

	return isEmail ? <span {...props}>{email}</span> : 'account';
}
