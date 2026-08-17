# WebSocket Real-time Communication

> Guide for real-time updates using the WebSocket system in this codebase.

## Quick Start

The WebSocket system provides real-time updates for file locking, notifications, and data changes. It uses a **split context architecture** to optimize re-renders.

## Core Concepts

### 1. Split Context Architecture

The system uses two separate contexts to prevent unnecessary re-renders:

```typescript
// src/contexts/WebSocket.tsx

// Stable context - changes infrequently
type WebSocketStableContextType = {
  readonly error: WebSocketConnectionReturn['error'];
  readonly ready: boolean;
  readonly send: WebSocketConnectionReturn['send'];
};

// Messages context - changes on every message
type WebSocketMessagesContextType = {
  readonly messages: MessagesCollection;
};

const WebSocketStableContext = createContext<WebSocketStableContextType | undefined>(undefined);
const WebSocketMessagesContext = createContext<WebSocketMessagesContextType | undefined>(undefined);
```

**Why split?** Components that only need to check if WebSocket is connected shouldn't re-render when messages arrive.

### 2. Three Hooks for Different Use Cases

#### `useWebSocketConnection()` - Stable State Only

Use when you need connection status or to send messages without receiving them:

```typescript
import { useWebSocketConnection } from '@/contexts/WebSocket';

function ConnectionIndicator() {
  const { ready, error } = useWebSocketConnection();

  if (error) return <span>Disconnected: {error.message}</span>;
  if (!ready) return <span>Connecting...</span>;
  return <span>Connected</span>;
}
```

**Does NOT cause re-renders when messages arrive.**

#### `useWebSocketMessages()` - Messages Only

Use when you need to react to real-time updates:

```typescript
import { useWebSocketMessages } from '@/contexts/WebSocket';

function FileStatus({ fileUuid }: { fileUuid: string }) {
  const messages = useWebSocketMessages();

  // Get messages for this specific file
  const lockMessage = messages[fileUuid]?.find(
    (msg) => msg.type === 'lock_status_changed'
  );

  return <span>{lockMessage?.data.status ? 'Locked' : 'Available'}</span>;
}
```

**Will re-render on every WebSocket message.**

#### `useWebSocket()` - Combined (Use Sparingly)

Use only when you need both connection state AND messages:

```typescript
import { useWebSocket } from '@/contexts/WebSocket';

function FullWebSocketComponent() {
  const { ready, error, send, messages } = useWebSocket();

  // Component has access to everything
}
```

**Prefer the granular hooks** - use this only when truly necessary.

## Message Structure

### Message Types

```typescript
type WebSocketMessageType =
  | 'auth_error'
  | 'auth_success'
  | 'error'
  | 'lock_status_changed'
  | 'notification'
  | 'update';

type WebSocketMessage<Type = Record<string, unknown>> = {
  readonly data: Type & {
    readonly pk?: number | string;  // Primary key for grouping
    readonly status?: boolean;
    readonly user?: string;
  };
  readonly timestamp?: string;
  readonly type: WebSocketMessageType;
};
```

### Message Collection

Messages are organized by primary key (`pk`) for efficient lookup:

```typescript
type MessagesCollection = {
  readonly [pk: string]: readonly WebSocketMessage[];  // Messages by entity ID
  readonly others: readonly WebSocketMessage[];         // Messages without pk
};
```

Each key maintains the **10 most recent messages** (newest first).

### Accessing Messages

```typescript
const messages = useWebSocketMessages();

// Get messages for a specific file
const fileMessages = messages['file-uuid-here'];

// Get the latest lock status message
const lockStatus = fileMessages?.find((m) => m.type === 'lock_status_changed');

// Get messages without a pk
const globalNotifications = messages.others;
```

## Reconnection Logic

### Configuration

```typescript
// src/hooks/useWebSocketConnection.ts

type WebSocketConfig = {
  readonly maxReconnectAttempts?: number;  // Default: 10
  readonly reconnectInterval?: number;     // Default: 3000ms
  readonly token?: string | undefined;
  readonly url: string;
};
```

### Reconnection Behavior

- **Exponential backoff**: `delay = interval * 1.5 ^ attempts`
- **Resets on success**: Attempt counter resets on `auth_success`
- **Max attempts**: After 10 failures, sets error state
- **No reconnect on**: Intentional close (code 1000) or auth failure

```typescript
const scheduleReconnect = useCallback(() => {
  if (reconnectAttemptsRef.current >= maxAttempts) {
    logger.error(LogCategory.WebSocket, 'Max reconnect attempts reached');
    setError({
      type: 'max_reconnects',
      message: 'Max reconnect attempts reached. Please refresh the page.',
    });
    return;
  }

  const delay = interval * 1.5 ** reconnectAttemptsRef.current;
  logger.debug(LogCategory.WebSocket, `Reconnecting in ${delay}ms`);

  setTimeout(() => {
    reconnectAttemptsRef.current += 1;
    // Trigger reconnection...
  }, delay);
}, []);
```

## Common Patterns

### File Locking Integration

Combine server state with real-time WebSocket updates:

```typescript
// src/hooks/useFileLocking.ts
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocketMessages } from '@/contexts/WebSocket';
import { $api } from '@/util/clientFetch';

export function useFileLocking({ fileUuid, currentUserEmail }) {
  const queryClient = useQueryClient();
  const messages = useWebSocketMessages();

  // 1. Get initial state from server
  const { data: lockData } = useSuspenseQuery(
    $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
      params: { path: { id: fileUuid } },
    }),
  );

  // 2. Check for real-time updates
  const lockMessage = messages[fileUuid]?.find(
    (message) => message.type === 'lock_status_changed'
  )?.data as { status?: boolean; user?: string } | undefined;

  // 3. Prefer WebSocket data if available, fallback to server state
  const isLocked = lockMessage?.status === undefined
    ? Boolean(lockData?.locked)
    : Boolean(lockMessage.status);

  const lockedBy = lockData?.locked_by?.email ?? lockMessage?.user ?? null;
  const canUnlock = Boolean(currentUserEmail && lockedBy === currentUserEmail);

  // 4. Provide actions that invalidate cache
  const invalidateStatus = async () => {
    await queryClient.invalidateQueries({
      queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
        params: { path: { id: fileUuid } },
      }).queryKey,
    });
  };

  return {
    status: { isLocked, lockedBy, canUnlock },
    lock: async () => { /* API call + invalidate */ },
    unlock: async () => { /* API call + invalidate */ },
  };
}
```

### Using in Components

```typescript
// src/components/File.tsx
'use client';

import { useFileLocking } from '@/hooks/useFileLocking';

function FileActions({ fileUuid }: { fileUuid: string }) {
  const { status, lock, unlock } = useFileLocking({
    fileUuid,
    currentUserEmail: 'user@example.com',
  });

  if (status.isLocked && !status.canUnlock) {
    return <span>Locked by {status.lockedBy}</span>;
  }

  return (
    <Button onPress={status.isLocked ? unlock : lock}>
      {status.isLocked ? 'Unlock' : 'Lock'}
    </Button>
  );
}
```

### Avoiding Stale Closures

When using values that change in callbacks, use refs:

```typescript
function useFileLocking({ fileUuid }) {
  // Use ref to prevent stale closures when fileUuid changes
  const fileUuidRef = useRef(fileUuid);
  fileUuidRef.current = fileUuid;

  const invalidateStatus = async () => {
    const currentUuid = fileUuidRef.current;  // Always current value
    await queryClient.invalidateQueries({
      queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/{id}/status/', {
        params: { path: { id: currentUuid } },
      }).queryKey,
    });
  };
}
```

## Provider Setup

The WebSocket provider is set up in the authenticated routes:

```typescript
// src/app/(main)/providers.tsx
import { WebSocketProvider } from '@/contexts/WebSocket';

export function Providers(props: ProvidersProps) {
  return (
    <EnvProvider env={props.env}>
      <WebSocketProvider>
        {props.children}
      </WebSocketProvider>
    </EnvProvider>
  );
}
```

The `WebSocketProvider`:
1. Fetches JWT token from `/api/v1/authjwtcookie/`
2. Connects to `env.BASE_WS_URL`
3. Handles authentication and reconnection
4. Provides both contexts to children

## Debugging

### Logging

WebSocket events are logged with `LogCategory.WebSocket`:

```typescript
import { logger, LogCategory } from '@/util/logger';

// Connection events
logger.debug(LogCategory.WebSocket, 'Connecting to WebSocket', { url });
logger.info(LogCategory.WebSocket, 'WebSocket authenticated');
logger.error(LogCategory.WebSocket, 'WebSocket error', { error: event.message });
logger.debug(LogCategory.WebSocket, `Reconnecting in ${delay}ms`);
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Not connected" | Token expired | Check auth, user may need to re-login |
| Max reconnects | Server down or network issue | Show "Refresh page" message |
| Messages not updating | Using wrong hook | Use `useWebSocketMessages()` not `useWebSocketConnection()` |
| Stale lock status | Closure captured old value | Use refs for changing values |

## Common Gotchas

1. **Using `useWebSocket()` everywhere**: Prefer granular hooks to minimize re-renders
2. **Forgetting message keys**: Messages are keyed by `pk` - access via `messages[entityUuid]`
3. **Not handling reconnection**: Show UI feedback when `error.type === 'max_reconnects'`
4. **Race conditions**: Server state + WebSocket can conflict - prefer WebSocket when available
5. **Missing provider**: Hooks throw if used outside `WebSocketProvider`

## Documentation Links

- [React Context](https://react.dev/reference/react/useContext)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
