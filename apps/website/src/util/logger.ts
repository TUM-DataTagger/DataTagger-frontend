/**
 * Structured logger utility with environment-aware log levels
 *
 * In development: logs debug, info, warn, and error
 * In production: logs only warn and error
 */

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

type LogContext = Record<string, unknown>;

/**
 * Logger categories for structured logging
 *
 * Categories are organized by domain. Each category represents a distinct
 * functional area of the application for filtering and analysis.
 */
export const LogCategory = {
	// ═══════════════════════════════════════════════════════════════
	// Authentication & Authorization
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Login, logout, password reset, external auth, redirects
	 */
	Auth: 'Auth',

	// ═══════════════════════════════════════════════════════════════
	// Error Handling
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Error boundaries, error pages, unhandled errors
	 */
	Error: 'Error',

	// ═══════════════════════════════════════════════════════════════
	// Data Operations
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Project CRUD operations
	 */
	Project: 'Project',

	/**
	 * Folder operations
	 */
	Folder: 'Folder',

	/**
	 * File CRUD operations (delete, bulk operations)
	 */
	File: 'File',

	/**
	 * File lock/unlock operations
	 */
	FileLocking: 'FileLocking',

	/**
	 * Draft file operations
	 */
	DraftFiles: 'DraftFiles',

	// ═══════════════════════════════════════════════════════════════
	// Metadata System
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Metadata field operations, diffs
	 */
	Metadata: 'Metadata',

	/**
	 * Metadata template CRUD, assignment
	 */
	MetadataTemplate: 'MetadataTemplate',

	/**
	 * Metadata template lock/unlock
	 */
	MetadataTemplateLocking: 'MetadataTemplateLocking',

	// ═══════════════════════════════════════════════════════════════
	// File Uploads (TUS)
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Upload lifecycle: registration, progress, completion, errors
	 */
	Upload: 'Upload',

	// ═══════════════════════════════════════════════════════════════
	// Infrastructure
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Query cache invalidations
	 */
	Cache: 'Cache',

	/**
	 * Next.js middleware
	 */
	Middleware: 'Middleware',

	/**
	 * WebSocket connection lifecycle
	 */
	WebSocket: 'WebSocket',

	/**
	 * Rate limiting, retries, backoff
	 */
	RateLimiter: 'RateLimiter',

	// ═══════════════════════════════════════════════════════════════
	// UI Components
	// ═══════════════════════════════════════════════════════════════
	/**
	 * TipTap rich text editor
	 */
	Editor: 'Editor',

	// ═══════════════════════════════════════════════════════════════
	// User Settings
	// ═══════════════════════════════════════════════════════════════
	/**
	 * User preference operations (theme, view mode)
	 */
	Settings: 'Settings',

	// ═══════════════════════════════════════════════════════════════
	// Feature System
	// ═══════════════════════════════════════════════════════════════
	/**
	 * Feature flag operations
	 */
	Flags: 'Flags',
} as const;

export type LogCategoryType = (typeof LogCategory)[keyof typeof LogCategory];

type LogEntry = {
	readonly category: string;
	readonly context?: LogContext;
	readonly level: LogLevel;
	readonly message: string;
	readonly timestamp: string;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const isDevelopment = process.env.NODE_ENV === 'development';
const minLogLevel: LogLevel = isDevelopment ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLogLevel];
}

function formatLogEntry(entry: LogEntry): string {
	const { level, category, message, context, timestamp } = entry;
	const contextStr = context ? ` ${JSON.stringify(context)}` : '';
	return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${contextStr}`;
}

function createLogEntry(level: LogLevel, category: LogCategoryType, message: string, context?: LogContext): LogEntry {
	const entry: LogEntry = {
		level,
		category,
		message,
		timestamp: new Date().toISOString(),
	};

	if (context !== undefined) {
		return { ...entry, context };
	}

	return entry;
}

function log(level: LogLevel, category: LogCategoryType, message: string, context?: LogContext): void {
	if (!shouldLog(level)) {
		return;
	}

	const entry = createLogEntry(level, category, message, context);
	const formatted = formatLogEntry(entry);

	switch (level) {
		case 'debug':
			console.debug(formatted);
			break;
		case 'info':
			console.info(formatted);
			break;
		case 'warn':
			console.warn(formatted);
			break;
		case 'error':
			console.error(formatted);
			break;
	}
}

/**
 * Structured logger with environment-aware log levels
 *
 * @example
 * ```ts
 * import { logger, LogCategory } from '@/util/logger';
 *
 * logger.debug(LogCategory.WebSocket, 'Connecting...', { url: 'wss://example.com' });
 * logger.error(LogCategory.Auth, 'Request failed', { status: 500, endpoint: '/users' });
 * ```
 */
export const logger = {
	/**
	 * Debug-level logging (development only)
	 * Use for detailed diagnostic information
	 */
	debug: (category: LogCategoryType, message: string, context?: LogContext) => log('debug', category, message, context),

	/**
	 * Info-level logging (development only)
	 * Use for general operational information
	 */
	info: (category: LogCategoryType, message: string, context?: LogContext) => log('info', category, message, context),

	/**
	 * Warning-level logging (always logged)
	 * Use for potentially problematic situations
	 */
	warn: (category: LogCategoryType, message: string, context?: LogContext) => log('warn', category, message, context),

	/**
	 * Error-level logging (always logged)
	 * Use for error conditions that should be investigated
	 */
	error: (category: LogCategoryType, message: string, context?: LogContext) => log('error', category, message, context),
} as const;

export type { LogLevel, LogContext, LogEntry };
