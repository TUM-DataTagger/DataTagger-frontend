import { CreateRouteActionFooter } from '@/components/create-route/frame/CreateRouteActionFooter';
import { CancelButton } from './CancelButton';

export function ProjectCreateFooter(props: { readonly step: number }) {
	return (
		<CreateRouteActionFooter
			alignment={props.step === 0 ? 'end' : 'between'}
			backHref={props.step === 1 ? '/projects/create/1' : undefined}
			cancelButton={<CancelButton />}
			form="project-create"
			submitLabel={props.step === 0 ? 'Next step' : 'Save & complete'}
		/>
	);
}
