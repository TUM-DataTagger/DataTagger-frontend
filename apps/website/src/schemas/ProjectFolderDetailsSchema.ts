import { any, nonEmpty, object, pipe, string, record, nullable, exactOptional } from 'valibot';

export const ProjectFolderDetailsSchema = object({
	name: pipe(string('Please name this folder.'), nonEmpty('Please name this folder.')),
	metadata_template: nullable(string()),
	description: exactOptional(record(string(), any())),
});
