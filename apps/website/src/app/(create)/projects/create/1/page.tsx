import type { Metadata } from 'next';
import { ProjectCreateFooter } from '../ProjectCreateFooter';
import { ProjectCreateHeader } from '../ProjectCreateHeader';
import { ProjectCreateStepOneForm } from './ProjectCreateStepOneForm';

export const metadata: Metadata = {
	title: 'Create project (1)',
};

export default async function Page() {
	return (
		<>
			<ProjectCreateHeader>
				<h1 className="text-base-heading-md dark:text-base-neutral-40 text-center">Create your first project</h1>
				<p className="text-base-md text-base-neutral-600 dark:text-base-neutral-300 max-w-[536px] place-self-center text-center">
					A project is the home of all your research data and acts as the container for all folders and files.
				</p>
			</ProjectCreateHeader>
			<div className="mx-auto flex w-full max-w-[536px] grow flex-col gap-4 px-4 py-10 md:px-0">
				<ProjectCreateStepOneForm />
			</div>
			<ProjectCreateFooter step={0} />
		</>
	);
}
