import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

type EditorClampOptions = {
	readonly contentRef: RefObject<HTMLDivElement | null>;
	readonly enabled: boolean;
	readonly lineCount?: number;
};

export function useEditorClampOverflow({ contentRef, enabled, lineCount = 2 }: EditorClampOptions): boolean {
	const [hasOverflow, setHasOverflow] = useState(false);

	useLayoutEffect(() => {
		if (!enabled) {
			setHasOverflow(false);
			return;
		}

		let observer: ResizeObserver | null = null;
		let frameId = 0;

		const measureFullHeight = (element: HTMLElement, width: number) => {
			const container = document.createElement('div');
			container.style.position = 'absolute';
			container.style.visibility = 'hidden';
			container.style.pointerEvents = 'none';
			container.style.width = `${width}px`;
			container.style.left = '-9999px';
			container.style.top = '0';

			const clone = element.cloneNode(true) as HTMLElement;
			clone.style.maxHeight = 'none';
			clone.style.height = 'auto';
			clone.style.overflow = 'visible';
			clone.style.display = 'block';
			clone.style.width = '100%';
			clone.style.webkitLineClamp = 'unset';
			clone.style.webkitBoxOrient = 'unset';

			container.appendChild(clone);
			document.body.appendChild(container);

			const height = clone.scrollHeight;

			document.body.removeChild(container);

			return height;
		};

		const checkOverflow = () => {
			const proseMirror = contentRef.current?.querySelector('.ProseMirror') as HTMLElement | null;

			if (!proseMirror) {
				frameId = requestAnimationFrame(checkOverflow);
				return;
			}

			const width = proseMirror.clientWidth;

			if (width === 0) {
				frameId = requestAnimationFrame(checkOverflow);
				return;
			}

			const styles = getComputedStyle(proseMirror);
			const lineHeight = Number.parseFloat(styles.lineHeight);
			const fontSize = Number.parseFloat(styles.fontSize);
			const resolvedLineHeight = Number.isFinite(lineHeight)
				? lineHeight
				: Number.isFinite(fontSize)
					? fontSize * 1.5
					: null;

			if (!resolvedLineHeight) {
				return;
			}

			const fullHeight = measureFullHeight(proseMirror, width);
			setHasOverflow(fullHeight > resolvedLineHeight * lineCount + 1);
		};

		checkOverflow();

		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(checkOverflow);
			const proseMirror = contentRef.current?.querySelector('.ProseMirror') as HTMLElement | null;

			if (proseMirror) {
				observer.observe(proseMirror);
			}
		}

		return () => {
			if (frameId) {
				cancelAnimationFrame(frameId);
			}

			observer?.disconnect();
		};
	}, [contentRef, enabled, lineCount]);

	return hasOverflow;
}
