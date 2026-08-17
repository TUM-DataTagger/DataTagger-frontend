type MetadataTemplatePoolHrefArgs = {
	readonly activeContainerPk?: string | null;
	readonly activeVersionPk?: string | null;
	readonly containerPk: string;
};

type FolderMetadataTemplatePoolHrefArgs = {
	readonly containerPk: string;
	readonly folderActiveContainerPk?: string | null;
	readonly folderActiveVersionPk?: string | null;
	readonly projectActiveContainerPk?: string | null;
	readonly projectActiveVersionPk?: string | null;
};

function buildMetadataTemplateContainerHref(containerPk: string, versionPk?: string | null) {
	return versionPk ? `/metadata-templates/${containerPk}?version=${versionPk}` : `/metadata-templates/${containerPk}`;
}

export function getProjectMetadataTemplatePoolHref({
	activeContainerPk,
	activeVersionPk,
	containerPk,
}: MetadataTemplatePoolHrefArgs) {
	return containerPk === activeContainerPk
		? buildMetadataTemplateContainerHref(containerPk, activeVersionPk)
		: buildMetadataTemplateContainerHref(containerPk);
}

export function getFolderMetadataTemplatePoolHref({
	containerPk,
	folderActiveContainerPk,
	folderActiveVersionPk,
	projectActiveContainerPk,
	projectActiveVersionPk,
}: FolderMetadataTemplatePoolHrefArgs) {
	if (containerPk === folderActiveContainerPk) {
		return buildMetadataTemplateContainerHref(containerPk, folderActiveVersionPk);
	}

	if (containerPk === projectActiveContainerPk) {
		return buildMetadataTemplateContainerHref(containerPk, projectActiveVersionPk);
	}

	return buildMetadataTemplateContainerHref(containerPk);
}
