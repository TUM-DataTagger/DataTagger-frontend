import { redirect } from 'next/navigation';

export default async function Page() {
	redirect('/projects/create/1');
}
