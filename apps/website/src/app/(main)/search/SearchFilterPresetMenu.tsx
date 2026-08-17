'use client';

import { Menu, MenuContent, MenuItem, MenuSection, MenuTrigger } from '@/components/ui/Menu';
import { type FilterPreset, FILTER_PRESETS } from '@/util/filterPresets';

type SearchFilterPresetMenuProps = {
	onPresetSelect(preset: FilterPreset): void;
};

export function SearchFilterPresetMenu(props: SearchFilterPresetMenuProps) {
	return (
		<Menu>
			<MenuTrigger variant="crystal-tonal">Pick a Preset</MenuTrigger>
			<MenuContent popover={{ arrow: false }}>
				<MenuSection items={FILTER_PRESETS} label="Search by">
					{(preset) => (
						<MenuItem
							id={preset.id}
							onAction={() => {
								const selected = FILTER_PRESETS.find((p) => p.id === preset.id);
								if (selected) {
									props.onPresetSelect(selected);
								}
							}}
							textValue={preset.label}
						>
							{preset.label}
						</MenuItem>
					)}
				</MenuSection>
			</MenuContent>
		</Menu>
	);
}
