import { any, nonEmpty, nullish, object, pipe, record, string } from 'valibot';

export const ProjectDetailsSchema = object({
	name: pipe(string('Please name your project.'), nonEmpty('Please name your project.')),
	metadata_template: nullish(string()),
	description: nullish(record(string(), any())),
});
