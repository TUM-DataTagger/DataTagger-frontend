# oRPC Server Actions

> Guide for implementing type-safe server actions with oRPC in this codebase.

## Quick Start

### Installation

```bash
pnpm --filter @fdm-frontend/website add @orpc/server @orpc/react
```

Optional packages:
- `@orpc/tanstack-query` - React Query integration
- `@orpc/valibot` - OpenAPI generation from Valibot schemas

## Core Concepts

### 1. The `.actionable()` Modifier

Converts any oRPC procedure into a Next.js server action:

```typescript
'use server';

import { os } from '@orpc/server';
import * as v from 'valibot';

export const myAction = os
  .input(v.object({ name: v.string() }))
  .handler(async ({ input }) => {
    return { greeting: `Hello, ${input.name}` };
  })
  .actionable();
```

### 2. Return Type: `[error, data]` Tuple

All actionable procedures return a tuple for type-safe error handling:

```typescript
// Client usage
const [error, data] = await myAction({ name: 'World' });

if (error) {
  // error.message, error.code available
  console.error(error);
} else {
  // data is typed: { greeting: string }
  console.log(data.greeting);
}
```

### 3. Context via Middleware

This codebase uses a pre-configured `proc` builder that injects Next.js request context:

```typescript
// src/server/proc.ts - already configured
import { os } from '@orpc/server';
import { cookies, headers } from 'next/headers';

type ORPCContext = {
  readonly cookies: Awaited<ReturnType<typeof cookies>>;
  readonly headers: Awaited<ReturnType<typeof headers>>;
};

export const proc = os.use(async ({ next }) => {
  const ctx: ORPCContext = {
    cookies: await cookies(),
    headers: await headers(),
  };
  return next({ context: ctx });
});
```

Use `proc` as the base for all server actions:

```typescript
// src/server/actions/myAction.ts
'use server';

import { proc } from '@/server/proc';

export const myAction = proc
  .handler(async ({ context }) => {
    const token = context.cookies.get('token');
    // ...
  })
  .actionable();
```

### 4. Input Validation with Valibot

oRPC supports Valibot via the Standard Schema interface:

```typescript
import { object, string, pipe, maxLength } from 'valibot';
import { proc } from '@/server/proc';

const InputSchema = object({
  name: pipe(string(), maxLength(100)),
});

export const myAction = proc
  .input(InputSchema)  // Valibot schema works directly
  .handler(async ({ input }) => {
    // input is typed and validated
  })
  .actionable();
```

### 5. Next.js Special Functions

`redirect()`, `notFound()`, and other Next.js functions work inside handlers:

```typescript
import { redirect } from 'next/navigation';
import { proc } from '@/server/proc';

export const logout = proc
  .handler(async ({ context }) => {
    context.cookies.delete('token');
    redirect('/');  // Works! Throws NEXT_REDIRECT internally
  })
  .actionable();
```

### 6. Type-Safe Errors with `.errors()`

Define specific error types for better client handling:

```typescript
import { ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { proc } from '@/server/proc';

export const myAction = proc
  .errors({
    VALIDATION_ERROR: {
      data: v.object({
        field: v.string(),
        message: v.string(),
      }),
    },
    NOT_FOUND: {},
    UNAUTHORIZED: {},
  })
  .handler(async ({ errors }) => {
    // Throw typed errors
    throw errors.NOT_FOUND();
    throw errors.VALIDATION_ERROR({ data: { field: 'email', message: 'Invalid' } });
  })
  .actionable();

// Client can discriminate errors
const [error, data] = await myAction({});
if (error?.defined && error.code === 'VALIDATION_ERROR') {
  console.log(error.data.field);  // Typed!
}
```

## React Hooks

### useServerAction

Manages action state (loading, error):

```typescript
import { useServerAction } from '@orpc/react';
import { myAction } from '@/server/actions';

function Component() {
  const { execute, status, error, data } = useServerAction(myAction);

  return (
    <button onClick={() => execute({ name: 'World' })} disabled={status === 'pending'}>
      {status === 'pending' ? 'Loading...' : 'Click'}
    </button>
  );
}
```

### useOptimisticServerAction

For optimistic UI updates:

```typescript
import { useOptimisticServerAction } from '@orpc/react';

const { execute, optimisticData } = useOptimisticServerAction(setFlag, {
  optimisticReducer: (current, input) => ({
    ...current,
    [input.key]: input.value,
  }),
});
```

## React Query Integration

If using `@orpc/tanstack-query`:

```typescript
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

// Create utils from router or client
export const orpc = createTanstackQueryUtils(client);

// Use in components
const query = useQuery(orpc.myAction.queryOptions({ input: { id: 1 } }));
const mutation = useMutation(orpc.myAction.mutationOptions());
```

## Middleware Patterns

### Logging Middleware

```typescript
import { onSuccess, onError } from '@orpc/server';
import { logger, LogCategory } from '@/util/logger';
import { proc } from '@/server/proc';

export function withLogging(category: LogCategory, actionName: string) {
  return [
    onSuccess(() => {
      logger.info(category, `${actionName} succeeded`);
    }),
    onError((error) => {
      logger.error(category, `${actionName} failed`, { error: error.message });
    }),
  ];
}

// Usage
export const myAction = proc
  .use(...withLogging(LogCategory.Auth, 'login'))
  .handler(...)
  .actionable();
```

### Auth Guard Middleware

```typescript
import { ORPCError } from '@orpc/server';
import { proc } from '@/server/proc';

export const withAuth = proc.middleware(async ({ context, next }) => {
  const token = context.cookies.get('token')?.value;

  if (!token) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Not authenticated' });
  }

  const user = await verifyToken(token);

  return next({
    context: { user },
  });
});

// Usage
export const protectedAction = withAuth
  .handler(async ({ context }) => {
    // context.user is available and typed
  })
  .actionable();
```

## File Organization

Recommended structure:

```
src/
  server/
    proc.ts                 # Procedure builder with context middleware
    actions/
      auth.ts               # Auth actions (login, logout)
      flags.ts              # Feature flag actions
      index.ts              # Re-exports all actions (optional)
```

For larger codebases with multiple middleware, consider:

```
src/
  server/
    proc.ts                 # Base procedure builder
    middleware/
      auth.ts               # withAuth middleware (extends proc)
      logging.ts            # Logging helpers
    actions/
      auth.ts               # Auth actions
      flags.ts              # Feature flag actions
```

## Common Gotchas

1. **`'use server'` directive**: Required at top of action files (in `actions/`), but NOT in `proc.ts`
2. **Context in handlers**: Access via `{ context }` destructuring, not global
3. **Redirect timing**: `redirect()` throws immediately, code after won't run
4. **Error data exposure**: `ORPCError.data` is sent to client - never include secrets
5. **Input is an object**: Unlike plain actions, oRPC always takes a single input object
6. **`proc.ts` exports a builder**: It's not a server action itself, so it doesn't need `'use server'`

## Documentation Links

- [oRPC Docs](https://orpc.dev/docs)
- [Server Actions Guide](https://orpc.dev/docs/server-action)
- [Next.js Adapter](https://orpc.dev/docs/adapters/next)
- [TanStack Query Integration](https://orpc.dev/docs/integrations/tanstack-query)
- [Context Guide](https://orpc.dev/docs/context)
- [Middleware Guide](https://orpc.dev/docs/middleware)
