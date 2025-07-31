import { evaluate, getProviderData, type KeyedFlagDefinitionType } from 'flags/next';
import { NextResponse } from 'next/server';

export async function GET() {
	const flags = {};

	const flagValues = await evaluate(Object.values<any>(flags));
	const values = Object.fromEntries(Object.values(flags).map((flag: any, index) => [flag.key, flagValues[index]]));

	return NextResponse.json({
		...getProviderData(flags as Record<string, KeyedFlagDefinitionType | readonly unknown[]>),
		values,
	});
}
