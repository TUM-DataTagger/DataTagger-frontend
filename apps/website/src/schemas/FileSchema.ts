import { any, nonEmpty, object, pipe, string, exactOptional, record } from 'valibot';
import { MetadataSchema } from '@/schemas/MetadataSchema';

export const FileSchema = object({
	name: pipe(string('Please name this file.'), nonEmpty('Please name this file.')),
	description: exactOptional(record(string(), any())),
	metadata: MetadataSchema.entries.metadata,
});
