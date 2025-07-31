import { nonEmpty, object, pipe, string } from 'valibot';

export const ProjectStepOneSchema = object({
	name: pipe(string('Please name your project.'), nonEmpty('Please name your project.')),
});

export const ProjectStepTwoSchema = object({
	name: pipe(string('Please name your folder.'), nonEmpty('Please name your folder.')),
	storage: string(),
});
