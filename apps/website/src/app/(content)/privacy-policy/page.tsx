import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { PrivacyPolicyTabs } from './PrivacyPolicyTabs';

export default async function Page() {
	const { data: cmsData } = await openAPIClient.GET('/api/v1/cms/{slug}/', {
		params: { path: { slug: 'privacy-policy' } },
	});

	if (!cmsData) {
		notFound();
	}

	return <PrivacyPolicyTabs textDE={cmsData.text_de_html} textEN={cmsData.text_en_html} />;
}
