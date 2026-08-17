import { any, nonEmpty, object, pipe, string, record, nullish } from 'valibot';

export const ProjectFolderDetailsSchema = object({
	name: pipe(string('Please name this folder.'), nonEmpty('Please name this folder.')),
	metadata_template: nullish(string()),
	description: nullish(record(string(), any())),
});
