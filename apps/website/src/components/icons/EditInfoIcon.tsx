'use client';

import { useTheme } from 'next-themes';
import { EditInfo, EditInfoDark } from './EditInfo';

export const EditInfoIcon = () => {
	const { resolvedTheme } = useTheme();

	return resolvedTheme === 'light' ? <EditInfo aria-hidden /> : <EditInfoDark aria-hidden />;
};
