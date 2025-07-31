import { NextResponse } from 'next/server';
import { versionInfo } from '@/util/version-info';

export async function GET() {
	return NextResponse.json({ buildId: versionInfo.hash });
}
