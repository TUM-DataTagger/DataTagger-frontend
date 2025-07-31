import { nonEmpty, object, pipe, string } from 'valibot';

export const FilenameEditSchema = object({
	name: pipe(string('Please name the file.'), nonEmpty('Please name the file.')),
});
