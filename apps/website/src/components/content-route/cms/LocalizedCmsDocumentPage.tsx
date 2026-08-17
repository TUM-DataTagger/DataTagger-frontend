import { notFound } from 'next/navigation';
import { openAPIClient } from '@/util/fetch';
import { LocalizedCmsTabs } from './LocalizedCmsTabs';

type LocalizedCmsDocumentPageProps = {
	readonly slug: 'accessibility' | 'privacy-policy' | 'terms-of-use';
};

export async function LocalizedCmsDocumentPage({ slug }: LocalizedCmsDocumentPageProps) {
	const { data: cmsData } = await openAPIClient.GET('/api/v1/cms/{slug}/', {
		params: { path: { slug } },
	});

	if (!cmsData) {
		notFound();
	}

	return <LocalizedCmsTabs textDE={cmsData.text_de_html} textEN={cmsData.text_en_html} />;
}
