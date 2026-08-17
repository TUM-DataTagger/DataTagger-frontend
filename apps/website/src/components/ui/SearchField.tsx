'use client';

import { SearchIcon, XCircleIcon } from 'lucide-react';
import type { Ref } from 'react';
import type { InputProps as RACInputProps, SearchFieldProps as RACSearchFieldProps } from 'react-aria-components';
import { SearchField as RACSearchField } from 'react-aria-components';
import { Button } from '@/components/ui/Button';
import { fieldStyles } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { cx } from '@/styles/cva';
import { composeTailwindRenderProps } from '@/styles/util';

export function SearchField(props: RACSearchFieldProps) {
	return (
		<RACSearchField
			{...props}
			aria-label={props['aria-label'] ?? 'Search'}
			className={composeTailwindRenderProps(props.className, cx(fieldStyles(), 'group/search-field'))}
			data-slot="control"
		/>
	);
}

export function SearchInput(props: RACInputProps & { readonly ref?: Ref<HTMLInputElement> }) {
	return (
		<InputGroup className="[--input-gutter-end:--spacing(8)]">
			<SearchIcon aria-hidden className="in-disabled:opacity-38" data-slot="icon" size={18} strokeWidth={1.5} />
			<Input {...props} />
			<Button
				aria-label="Clear search"
				className="h-full group-empty/search-field:invisible"
				size="icon"
				slot="clear"
				type="button"
				variant="unset"
			>
				<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
			</Button>
		</InputGroup>
	);
}
