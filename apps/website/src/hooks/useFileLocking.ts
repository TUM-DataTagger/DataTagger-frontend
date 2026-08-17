'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { $api, openAPIClient } from '@/util/clientFetch';
import { logger, LogCategory } from '@/util/logger';

type UseFileLockingOptions = {
	readonly currentUserEmail?: string;
	readonly fileUuid: string;
};

type FileLockStatus = {
	/**
	 * Whether the current user can unlock the file
	 */
	readonly canUnlock: boolean;
	/**
	 * Whether the file is currently locked
	 */
	readonly isLocked: boolean;
	/**
	 * Email of the user who locked the file
	 */
	readonly lockedBy: string | null;
};

type FileLockingReturn = {
	/**
	 * Check if the file is locked (refreshes from server)
	 */
	checkLockStatus(): Promise<unknown>;
	/**
	 * Lock the file for editing
	 */
	lock(): Promise<unknown>;
	/**
	 * Current lock status
	 */
	readonly status: FileLockStatus;
	/**
	 * Unlock the file
	 */
	unlock(): Promise<unknown>;
};

/**
 * Hook for managing file locking state
 *
 * Combines server state with real-time WebSocket updates for lock status.
 *
 * @example
 * ```tsx
 * const { status, lock, unlock, checkLockStatus } = useFileLocking({
 *   fileUuid: 'abc-123',
 *   currentUserEmail: user?.email,
 * });
 *
 * if (status.isLocked && !status.canUnlock) {
 *   return <LockedBanner lockedBy={status.lockedBy} />;
 * }
 * ```
 */
export function useFileLocking({ fileUuid, currentUserEmail }: UseFileLockingOptions): FileLockingReturn {
	const queryClient = useQueryClient();
	const messages = useWebSocketMessages();

	// Use ref to prevent stale closures when fileUuid changes
	const fileUuidRef = useRef(fileUuid);
	fileUuidRef.current = fileUuid;

	const { data: lockData } = useSuspenseQuery(
		$api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
			params: { path: { id: fileUuid } },
		}),
	);

	// Check for real-time lock status updates via WebSocket
	const lockMessage = messages[fileUuid]?.find((message) => message.type === 'lock_status_changed')?.data as
		| { status?: boolean; user?: string }
		| undefined;

	const isLocked = lockMessage?.status === undefined ? Boolean(lockData?.locked) : Boolean(lockMessage.status);
	const lockedBy = lockData?.locked_by?.email ?? lockMessage?.user ?? null;
	const canUnlock = Boolean(currentUserEmail && lockedBy === currentUserEmail);
	const status: FileLockStatus = { isLocked, lockedBy, canUnlock };

	const invalidateStatus = async () => {
		const currentUuid = fileUuidRef.current;
		await queryClient.invalidateQueries({
			queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: currentUuid } },
			}).queryKey,
		});
	};

	const checkLockStatus = async () => {
		const currentUuid = fileUuidRef.current;
		try {
			logger.debug(LogCategory.FileLocking, 'Checking lock status', { fileUuid: currentUuid });
			const { data } = await openAPIClient.GET('/api/v1/uploads-dataset/{id}/status/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			return data;
		} catch (error) {
			logger.error(LogCategory.FileLocking, 'Failed to check lock status', {
				fileUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	const lock = async () => {
		const currentUuid = fileUuidRef.current;
		try {
			logger.info(LogCategory.FileLocking, 'Locking file', { fileUuid: currentUuid });
			const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/lock/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			logger.debug(LogCategory.FileLocking, 'File locked successfully', { fileUuid: currentUuid });
			return data;
		} catch (error) {
			logger.error(LogCategory.FileLocking, 'Failed to lock file', {
				fileUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	const unlock = async () => {
		const currentUuid = fileUuidRef.current;
		try {
			logger.info(LogCategory.FileLocking, 'Unlocking file', { fileUuid: currentUuid });
			const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/{id}/unlock/', {
				params: { path: { id: currentUuid } },
			});

			await invalidateStatus();
			logger.debug(LogCategory.FileLocking, 'File unlocked successfully', { fileUuid: currentUuid });
			return data;
		} catch (error) {
			logger.error(LogCategory.FileLocking, 'Failed to unlock file', {
				fileUuid: currentUuid,
				error: error instanceof Error ? error.message : 'Unknown',
			});
			throw error;
		}
	};

	return { status, checkLockStatus, lock, unlock };
}
