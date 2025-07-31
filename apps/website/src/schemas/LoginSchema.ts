import { email, nonEmpty, object, pipe, string } from 'valibot';

export const LoginSchema = object({
	email: pipe(
		string('Please enter a valid email address'),
		email('Please enter a valid email address'),
		nonEmpty('Please enter a valid email address'),
	),
	password: pipe(string('Please enter your password'), nonEmpty('Please enter your password')),
});
