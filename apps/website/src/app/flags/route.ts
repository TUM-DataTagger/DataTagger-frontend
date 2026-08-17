import { evaluate, getProviderData, type KeyedFlagDefinitionType } from 'flags/next';
import { NextResponse } from 'next/server';
import { developerToolbarFlags } from '@/flags';

export async function GET() {
	const flags = developerToolbarFlags;
	const flagDefinitions = Object.values(flags);

	const flagValues = await evaluate(flagDefinitions);
	const values = Object.fromEntries(flagDefinitions.map((flag, index) => [flag.key, flagValues[index]]));

	return NextResponse.json({
		...getProviderData(flags as Record<string, KeyedFlagDefinitionType | readonly unknown[]>),
		values,
	});
}
