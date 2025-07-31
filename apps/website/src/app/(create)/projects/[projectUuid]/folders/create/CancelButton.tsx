'use client';

// import { useSetAtom } from 'jotai';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { initialState, projectAtom } from '@/stores/createProject';

export function CancelButton() {
	const router = useRouter();
	const setCreateProject = useSetAtom(projectAtom);

	async function onPress() {
		setCreateProject(initialState);
		router.push('../folders');
	}

	return (
		<Button onPress={async () => onPress()} variant="secondary-discreet">
			Cancel
		</Button>
	);
}
