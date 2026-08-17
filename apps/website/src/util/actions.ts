/**
 * The initial Action state
 */
export type InitialState = {
	data: undefined;
	errors: undefined;
	ok: undefined;
	redirect: undefined;
};

/**
 * Actions should generally return a Promise\<ActionResult<T>\>.
 * Their `initialState` should be `ActionResult<T>`.
 */
export type ActionResult<Type> = ErrorResult | InitialState | SuccessResult<Type>;

/**
 * Sucessful actions can return JSON of any shape under `data`.
 */
export type SuccessResult<Type> = {
	data: Type;
	errors: undefined;
	ok: true;
};

/**
 * An error response should have a top level `error` string, and then keyed
 * messages depending on what fields errored out.
 */
export type ErrorData = {
	[field: string]: string | undefined;
	error: string;
	root?: string;
};

/**
 * Input type for the error() function - accepts either a string
 * or a partial error object with optional fields.
 */
export type ErrorInput = Partial<ErrorData> | string;

/**
 * An error response shape
 */
export type ErrorResult = {
	errors: ErrorData;
	ok: false;
};

/**
 * When using `useFormState`, this should be the initialState value
 */
export const initialState: InitialState = { ok: undefined, data: undefined, errors: undefined, redirect: undefined };

/**
 * Formats and returns a successful action result value
 *
 * @param data - The JSON value the action wants to return
 * @returns A formatted successful action result value
 */
export function ok<Type>(data: Type): SuccessResult<Type> {
	return {
		ok: true,
		data,
		errors: undefined,
	};
}

/**
 * Formats and returns an unsuccessful action result
 *
 * @param errors - An error object keyed by field or an error string
 * @returns A formatted action error value
 */
export function error(errors: ErrorInput): ErrorResult {
	if (typeof errors === 'string') {
		return {
			ok: false,
			errors: { error: errors },
		};
	}

	// Ensure the error field is always present
	const result: ErrorData = {
		error: errors.error ?? errors.root ?? 'An error occurred',
		...errors,
	};

	return {
		ok: false,
		errors: result,
	};
}

export function isError<Type>(response: ActionResult<Type>): response is ErrorResult {
	return response.ok === false && 'errors' in response;
}

export function isSuccess<Type>(response: ActionResult<Type>): response is SuccessResult<Type> {
	return response.ok === true;
}

export function isFetchError(error: unknown): error is Error {
	return error instanceof TypeError && error.message === 'fetch failed';
}
