import { nonEmpty, object, pipe, string } from 'valibot';

export const FolderNameEditSchema = object({
	name: pipe(string('Please name the folder.'), nonEmpty('Please name the folder.')),
});
