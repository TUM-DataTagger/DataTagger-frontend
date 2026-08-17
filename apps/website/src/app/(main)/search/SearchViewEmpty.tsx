export function SearchViewEmpty() {
	return (
		<div className="flex h-[272px] flex-col place-content-center rounded-xl p-px">
			<div className="h-full w-full place-content-center place-items-center rounded-xl bg-base-lavender-100/64 p-4 text-center dark:bg-base-lavender-800/64">
				<div className="flex flex-col gap-2">
					<span className="text-base-xl">No matching results found</span>
					<div className="flex flex-col place-content-center place-items-center gap-8">
						<span>Please try other search inputs.</span>
					</div>
				</div>
			</div>
		</div>
	);
}
