export function SearchViewEmpty() {
	return (
		<div className="flex h-[272px] flex-col place-content-center rounded-xl p-px">
			<div className="bg-base-lavender-100/64 dark:bg-base-lavender-800/64 h-full w-full place-content-center place-items-center rounded-xl text-center">
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
