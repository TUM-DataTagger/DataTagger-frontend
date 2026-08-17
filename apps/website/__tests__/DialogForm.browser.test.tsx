import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Button } from '@/components/ui/Button';
import { Form, useDialogForm } from '@/components/ui/Form';
import { ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';

function DialogFormHarness(props: { onSubmit(): void }) {
	const { formProps, submitButtonProps } = useDialogForm('dialog-form-test');

	return (
		<ModalContent aria-label="Dialog form wiring test" isOpen onOpenChange={() => {}}>
			<ModalHeader>
				<ModalTitle>Dialog form wiring test</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Form
					{...formProps}
					onSubmit={(event) => {
						event.preventDefault();
						props.onSubmit();
					}}
				>
					<input defaultValue="ready" name="value" />
				</Form>
			</ModalBody>
			<ModalFooter>
				<Button {...submitButtonProps} variant="filled">
					Submit
				</Button>
			</ModalFooter>
		</ModalContent>
	);
}

describe('Dialog form wiring', () => {
	it('submits when the footer button is associated to a form inside the modal body', async () => {
		const onSubmit = vi.fn();
		const screen = await render(<DialogFormHarness onSubmit={onSubmit} />);

		await screen.getByRole('button', { name: 'Submit' }).click();

		await vi.waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});
	});
});
