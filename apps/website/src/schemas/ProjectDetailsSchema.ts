import { any, exactOptional, nonEmpty, nullable, object, pipe, record, string } from 'valibot';

export const ProjectDetailsSchema = object({
	name: pipe(string('Please name your project.'), nonEmpty('Please name your project.')),
	metadata_template: nullable(string()),
	description: exactOptional(record(string(), any())),
});
