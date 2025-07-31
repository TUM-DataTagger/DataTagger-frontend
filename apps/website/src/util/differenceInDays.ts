import { diffDays } from '@formkit/tempo';

export function differenceInDays(date: string) {
	return diffDays(date, new Date());
}
