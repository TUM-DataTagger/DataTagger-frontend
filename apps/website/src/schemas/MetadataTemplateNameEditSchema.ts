import { nonEmpty, object, pipe, string } from 'valibot';

export const MetadataTemplateNameEditSchema = object({
	name: pipe(
		string('Please enter a valid metadata template name'),
		nonEmpty('Please enter a valid metadata template name'),
	),
});
