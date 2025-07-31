export const ENV = {
	IS_LOCAL_DEV: process.env.NODE_ENV === 'development',
	IS_STAGING: process.env.STAGING === 'true',
	BASE_API_URL: process.env.BASE_API_URL ?? '',
	BASE_WS_URL: process.env.BASE_WS_URL ?? '',
	NEXT_PUBLIC_BASE_API_URL: process.env.NEXT_PUBLIC_BASE_API_URL ?? '',
};
