import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const TESTS_DIR = fileURLToPath(new URL('.', import.meta.url));
const SRC_DIR = join(TESTS_DIR, '..', 'src');
const VALID_WIRING_MARKERS = ['submitButtonProps', 'form="', 'form={'];

function getTsxFiles(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const fullPath = join(directory, entry);
		const stats = statSync(fullPath);

		if (stats.isDirectory()) {
			return getTsxFiles(fullPath);
		}

		return fullPath.endsWith('.tsx') ? [fullPath] : [];
	});
}

function hasBrokenModalFormWiring(source: string) {
	return source
		.split('<ModalContent')
		.slice(1)
		.some((modalBlock) => {
			const hasRiskyShape =
				modalBlock.includes('<ModalBody') &&
				modalBlock.includes('<Form ') &&
				modalBlock.includes('<ModalFooter') &&
				modalBlock.includes('type="submit"');

			if (!hasRiskyShape) {
				return false;
			}

			return !VALID_WIRING_MARKERS.some((marker) => modalBlock.includes(marker));
		});
}

describe('modal dialog form wiring', () => {
	it('requires explicit footer-to-form association when a modal body form submits from the footer', () => {
		const offenders = getTsxFiles(SRC_DIR)
			.filter((filePath) => hasBrokenModalFormWiring(readFileSync(filePath, 'utf8')))
			.map((filePath) => relative(join(TESTS_DIR, '..'), filePath));

		expect(offenders).toEqual([]);
	});
});
