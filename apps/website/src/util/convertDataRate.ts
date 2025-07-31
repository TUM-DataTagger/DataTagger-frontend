export function convertDataRateLog(inputBytesPerSecond?: number | string, data = true): string | null {
	if (!inputBytesPerSecond) {
		return null;
	}

	const inputBytesPerSecondConverted =
		typeof inputBytesPerSecond === 'string' ? Number.parseFloat(inputBytesPerSecond) : inputBytesPerSecond;

	const dataUnits = ['B', 'kB', 'MB', 'GB', 'TB'];
	const speedUnits = ['B/s', 'kB/s', 'MB/s', 'GB/s', 'TB/s'];
	const units = data ? dataUnits : speedUnits;
	const base = 1_000;

	if (inputBytesPerSecondConverted < 1) {
		return inputBytesPerSecondConverted + ' ' + units[0];
	}

	const exponent = Math.floor(Math.log10(inputBytesPerSecondConverted) / Math.log10(base));
	const value = inputBytesPerSecondConverted / base ** exponent;

	return value.toFixed(2) + ' ' + units[exponent];
}

export function convertDataRateLogBinary(inputBytesPerSecond?: number | string, data = true): string | null {
	if (!inputBytesPerSecond) {
		return null;
	}

	const dataUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	const speedUnits = ['B/s', 'KiB/s', 'MiB/s', 'GiB/s', 'TiB/s'];
	const units = data ? dataUnits : speedUnits;
	const base = 1_024;

	const inputBytesPerSecondConverted =
		typeof inputBytesPerSecond === 'string' ? Number.parseFloat(inputBytesPerSecond) : inputBytesPerSecond;

	if (inputBytesPerSecondConverted < 1) {
		return inputBytesPerSecondConverted + ' ' + units[0];
	}

	const exponent = Math.floor(Math.log2(inputBytesPerSecondConverted) / Math.log2(base));
	const value = inputBytesPerSecondConverted / base ** exponent;

	return value.toFixed(2) + ' ' + units[exponent];
}
