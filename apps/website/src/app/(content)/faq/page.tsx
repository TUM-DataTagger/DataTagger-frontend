import { ChevronDownIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { openAPIClient } from '@/util/fetch';
import { FaqAnswer } from './FaqAnswer';

export default async function Page() {
	const { data: faqCategoriesData } = await openAPIClient.GET('/api/v1/faq-category/');

	if (!faqCategoriesData?.length) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-6">
			{faqCategoriesData.map((faqCategory, index) => (
				<Fragment key={faqCategory.pk}>
					<h2 className="ml-4 flex h-8 place-items-center text-base-heading-xs">
						<div className="flex h-6.5 w-6 flex-col place-items-center gap-1">
							<div className="mr-4 ml-4.5 text-base-label-sm">{String(index + 1).padStart(2, '0')}</div>
							<div className="mr-4 ml-4.5 w-full border-b border-base-green-lime-600" />
						</div>
						<span>{faqCategory.name}</span>
					</h2>
					<div className="ml-10">
						<Accordion className="flex flex-col gap-4" type="multiple">
							{faqCategory.faq.map((faq) => (
								<AccordionItem key={faq.pk} value={faq.pk}>
									<AccordionTrigger
										append={
											<ChevronDownIcon
												aria-hidden
												className="duration-200 group-data-[state=open]:rotate-180"
												size={24}
												strokeWidth={1.5}
											/>
										}
										className="flex items-center justify-between rounded-lg border border-base-neutral-100 px-6 py-4 text-left text-base-label-lg text-base-neutral-900 transition-all data-[state=closed]:rounded-lg data-[state=open]:rounded-t-lg data-[state=open]:rounded-b-none dark:border-base-neutral-700 dark:text-base-neutral-40"
									>
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="rounded-b-lg border border-t-0 bg-base-neutral-40 px-6 py-4 text-base-neutral-900 dark:bg-base-neutral-700/40 dark:text-base-neutral-40">
										<FaqAnswer html={faq.answer_html ?? ''} />
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</Fragment>
			))}
		</div>
	);
}
