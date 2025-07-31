import { nonEmpty, object, pipe, string } from 'valibot';

export const ProjectFolderSchema = object({
	name: pipe(string('Please enter a valid folder name'), nonEmpty('Please enter a valid folder name')),
	storage: string(),
});
