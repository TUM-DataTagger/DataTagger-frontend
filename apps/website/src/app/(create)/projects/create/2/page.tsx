import type { Metadata } from 'next';
import { ProjectCreateFooter } from '../ProjectCreateFooter';
import { ProjectCreateHeader } from '../ProjectCreateHeader';
import { ProjectCreateStepTwoForm } from './ProjectCreateStepTwoForm';

export const metadata: Metadata = {
	title: 'Create project (2)',
};

export default async function Page() {
	return (
		<>
			<ProjectCreateHeader>
				<h1 className="text-base-heading-md dark:text-base-neutral-40 text-center">Set up project's first folder</h1>
				<p className="text-base-md text-base-neutral-600 dark:text-base-neutral-300 max-w-[536px] place-self-center text-center">
					Create a folder within a project to centrally manage your research data and give access to selected members of
					your project.
				</p>
			</ProjectCreateHeader>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-10 md:px-0">
				<ProjectCreateStepTwoForm />
			</div>
			<ProjectCreateFooter step={1} />
		</>
	);
}
