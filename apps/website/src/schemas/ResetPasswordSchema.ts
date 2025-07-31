import { check, nonEmpty, object, pipe, string } from 'valibot';

export const ResetPasswordSchema = object({
	password: pipe(
		string(
			'Password must be at least 8 characters long, contain upper and lower case, a special character and a number',
		),
		nonEmpty(
			'Password must be at least 8 characters long, contain upper and lower case, a special character and a number',
		),
		check(
			(value) => /^(?=.*\d)(?=.*[!"#$%&'-./:;<=>?\\^_`|~§´ÄÖÜßäöü€])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(value),
			'Password must be at least 8 characters long, contain upper and lower case, a special character and a number',
		),
	),
});
