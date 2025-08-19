export function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label class="inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				value=""
				class="sr-only peer"
				checked={checked}
				onChange={() => onChange(!checked)}
			/>
			<div
				class="relative w-11 h-6 bg-black/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300
            dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full
            rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-['']
            after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full
            after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600 dark:peer-checked:bg-violet-600"
			></div>
			<span class="ms-3 text-gray-900 dark:text-gray-300">{label}</span>
		</label>
	);
}
