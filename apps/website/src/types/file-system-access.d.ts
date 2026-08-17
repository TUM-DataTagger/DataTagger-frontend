/**
 * Type definitions for the File System Access API
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 *
 * This API enables streaming file writes to disk without memory buffering,
 * which is critical for exporting large files (multi-GB) without crashing the browser.
 */

export {};

/**
 * A WritableStream that writes to a file on the user's disk.
 * Data written to this stream flows directly to storage without full memory buffering.
 */
interface FileSystemWritableFileStream extends WritableStream<BlobPart> {
	/**
	 * Moves the current file cursor to the specified position.
	 */
	seek(position: number): Promise<void>;

	/**
	 * Resizes the file to the specified number of bytes.
	 * If the new size is larger, the file is padded with null bytes.
	 * If smaller, the file is truncated.
	 */
	truncate(size: number): Promise<void>;

	/**
	 * Writes data to the file at the current position.
	 * Can accept ArrayBuffer, TypedArray, DataView, Blob, or string.
	 */
	write(data: BlobPart): Promise<void>;
}

/**
 * A handle to a file entry in the user's file system.
 * Provides methods to read/write the file contents.
 */
interface FileSystemFileHandle {
	/**
	 * Creates a writable stream for writing to the file.
	 * Pass keepExistingData: true in options to preserve existing file content.
	 */
	createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
	/**
	 * Returns a File object representing the file.
	 */
	getFile(): Promise<File>;

	readonly kind: 'file';

	readonly name: string;

	/**
	 * Checks the current permission state for this handle.
	 */
	queryPermission?(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'denied' | 'granted' | 'prompt'>;

	/**
	 * Requests permission to read from or write to the file.
	 */
	requestPermission?(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'denied' | 'granted' | 'prompt'>;
}

/**
 * File type filter for save/open file pickers.
 */
interface FilePickerAcceptType {
	/**
	 * Mapping of MIME types to file extensions.
	 * Example: `\{ 'application/zip': ['.zip'] \}`
	 */
	accept: Record<string, string[]>;

	/**
	 * Human-readable description of the file type.
	 */
	description?: string;
}

/**
 * Options for the showSaveFilePicker dialog.
 */
interface SaveFilePickerOptions {
	/**
	 * If true, excludes the "All files (*.*)" option from the dialog.
	 */
	excludeAcceptAllOption?: boolean;

	/**
	 * Unique identifier for remembering the last directory.
	 */
	id?: string;

	/**
	 * Initial directory to start in.
	 */
	startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';

	/**
	 * Suggested file name for the save dialog.
	 */
	suggestedName?: string;

	/**
	 * An array of allowed file types.
	 */
	types?: FilePickerAcceptType[];
}

/**
 * Base interface for file system handles (files and directories).
 */
interface FileSystemHandle {
	readonly kind: 'directory' | 'file';
	readonly name: string;
}

declare global {
	interface Window {
		/**
		 * Opens a file save dialog and returns a handle to the selected file.
		 *
		 * Throws DOMException if the user cancels the dialog, if called without user activation, or if options are invalid.
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
		 */
		showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
	}
}
