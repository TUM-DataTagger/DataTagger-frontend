import { ChevronDownIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { openAPIClient } from '@/util/fetch';

export default async function Page() {
	const { data: faqCategoriesData } = await openAPIClient.GET('/api/v1/faq-category/');

	if (!faqCategoriesData?.length) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-6">
			{faqCategoriesData.map((faqCategory, index) => (
				<Fragment key={faqCategory.pk}>
					<div className="text-base-heading-xs ml-4 flex h-8 place-items-center">
						<div className="flex h-[26px] w-6 flex-col place-items-center gap-1">
							<div className="text-base-label-sm mr-4 ml-[-18px]">{String(index + 1).padStart(2, '0')}</div>
							<div className="border-base-green-lime-600 mr-4 ml-[-18px] w-full border-b" />
						</div>
						<span>{faqCategory.name}</span>
					</div>
					<div className="ml-10">
						<Accordion className="not-prose flex flex-col gap-4" type="multiple">
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
										className="border-base-neutral-100 text-base-label-lg text-base-neutral-900 dark:border-base-neutral-700 dark:text-base-neutral-40 flex items-center justify-between rounded-lg border px-6 py-4 text-left transition-all data-[state=closed]:rounded-lg data-[state=open]:rounded-t-lg data-[state=open]:rounded-b-none"
									>
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="bg-base-neutral-40 text-base-neutral-900 dark:bg-base-neutral-700/40 dark:text-base-neutral-40 rounded-b-lg border border-t-0 px-6 py-4">
										<span className="text-base-md">{faq.answer}</span>
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
