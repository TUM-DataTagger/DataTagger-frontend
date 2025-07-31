import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { TermsOfUseTabs } from './TermsOfUseTabs';

export default async function Page() {
	const { data: cmsData } = await openAPIClient.GET('/api/v1/cms/{slug}/', {
		params: { path: { slug: 'terms-of-use' } },
	});

	if (!cmsData) {
		notFound();
	}

	return <TermsOfUseTabs textDE={cmsData.text_de_html} textEN={cmsData.text_en_html} />;
}
