import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { FaqAnswer } from '@/app/(content)/faq/FaqAnswer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

describe('FAQ answer markdown HTML', () => {
	it('inherits content-page prose styling', async () => {
		const screen = await render(
			<div className="prose prose-sm prose-neutral">
				<FaqAnswer html={'<p>Read the <a href="/terms-of-use">terms of use</a>.</p>'} />
			</div>,
		);
		const link = screen.getByRole('link', { name: 'terms of use' }).element() as HTMLAnchorElement;
		const paragraph = screen.getByText(/Read the/).element();

		expect(link).toHaveAttribute('href', '/terms-of-use');
		expect(getComputedStyle(link).textDecorationLine).toContain('underline');
		expect(getComputedStyle(link).fontWeight).toBe('500');
		expect(getComputedStyle(paragraph).lineHeight).toBe('24px');
	});

	it('uses a block wrapper for markdown-generated HTML', async () => {
		const screen = await render(<FaqAnswer html={'<p>Paragraph from CMS markdown.</p>'} />);
		const paragraph = screen.getByText('Paragraph from CMS markdown.').element();

		expect(paragraph.parentElement?.tagName).toBe('DIV');
	});

	it('keeps the accordion header outside prose styling', async () => {
		const screen = await render(
			<div className="prose prose-sm prose-neutral">
				<Accordion defaultValue={['faq']} type="multiple">
					<AccordionItem value="faq">
						<AccordionTrigger>Question</AccordionTrigger>
						<AccordionContent>
							<FaqAnswer html="<p>Answer</p>" />
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>,
		);
		const trigger = screen.getByRole('button', { name: 'Question' }).element();

		expect(trigger.closest('h3')).toHaveClass('not-prose');
	});
});
