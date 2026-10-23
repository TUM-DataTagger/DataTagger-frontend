import { check, nonEmpty, object, pipe, string, trim } from 'valibot';

export const SubfolderNameSchema = object({
	name: pipe(
		string('Please name the subfolder.'),
		trim(),
		nonEmpty('Please name the subfolder.'),
		check((value) => !/[/\\]/.test(value) && value !== '.' && value !== '..', 'Please use a name without slashes.'),
	),
});
