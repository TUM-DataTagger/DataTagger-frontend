import { describe, expect, it } from 'vitest';
import { MAIN_NAVIGATION_ITEMS } from '@/app/navigationItems';

describe('main navigation items', () => {
	it('keeps the primary routes in their shared display order', () => {
		expect(
			MAIN_NAVIGATION_ITEMS.map((item) => ({
				href: item.href,
				id: item.id,
				label: item.label,
			})),
		).toEqual([
			{ href: '/drafts', id: 'drafts', label: 'My draft files' },
			{ href: '/projects', id: 'projects', label: 'Projects' },
			{ href: '/experiments', id: 'experiments', label: 'Experiments' },
			{ href: '/metadata-templates', id: 'metadata-templates', label: 'Metadata templates' },
			{ href: '/search', id: 'advanced-search', label: 'Advanced search' },
		]);
	});
});
