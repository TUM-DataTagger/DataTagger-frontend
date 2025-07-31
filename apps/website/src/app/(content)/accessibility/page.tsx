import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { AccessibilityTabs } from './AccessibilityTabs';

export default async function Page() {
	const { data: cmsData } = await openAPIClient.GET('/api/v1/cms/{slug}/', {
		params: { path: { slug: 'accessibility' } },
	});

	if (!cmsData) {
		notFound();
	}

	return <AccessibilityTabs textDE={cmsData.text_de_html} textEN={cmsData.text_en_html} />;
}
