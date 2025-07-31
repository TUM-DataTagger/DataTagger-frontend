import { object, string } from 'valibot';

export const VersionSchema = object({
	name: string(),
});
