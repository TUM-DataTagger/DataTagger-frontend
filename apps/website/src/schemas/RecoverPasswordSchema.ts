import { email, nonEmpty, object, pipe, string } from 'valibot';

export const RecoverPasswordSchema = object({
	email: pipe(
		string('Please enter a valid email address'),
		email('Please enter a valid email address'),
		nonEmpty('Please enter a valid email address'),
	),
});
