import { literal, nonEmpty, nullish, object, pipe, string, union } from 'valibot';
import { MetadataSchema } from '@/schemas/MetadataSchema';

export const MetadataTemplateSchema = object({
	name: pipe(
		string('Please enter a valid metadata template name'),
		nonEmpty('Please enter a valid metadata template name'),
	),
	assigned_to_content_type: nullish(union([literal('projects.project'), literal('folders.folder')])),
	assigned_to_object_id: nullish(string()),
	metadata_template_fields: MetadataSchema.entries.metadata,
});
