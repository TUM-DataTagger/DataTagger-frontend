import { FolderIcon, PackageIcon } from 'lucide-react';
import { Tag, TagGroup } from '@/components/ui/TagGroup';

export type MetadataTemplateSource = 'folder' | 'project';

export function ProjectFolderMetadataTemplateSourceBadge(props: { readonly source: MetadataTemplateSource }) {
	const label = props.source === 'project' ? 'Project' : 'Folder';
	const Icon = props.source === 'project' ? PackageIcon : FolderIcon;

	return (
		<TagGroup aria-label="Metadata template source">
			<Tag className="select-none" color="neutral" textValue={label}>
				<Icon aria-hidden className="shrink-0" size={18} strokeWidth={1.5} />
				<span className="truncate" title={label}>
					{label}
				</span>
			</Tag>
		</TagGroup>
	);
}
