# React Query + OpenAPI Data Fetching

> Guide for type-safe data fetching with React Query and OpenAPI in this codebase.

## Quick Start

### Installation

```bash
pnpm --filter @fdm-frontend/website add @tanstack/react-query openapi-fetch openapi-react-query
```

Optional packages:
- `@tanstack/react-query-devtools` - Development tools
- `nuqs` - URL state synchronization for pagination

## Core Concepts

### 1. Dual OpenAPI Clients

This codebase uses **two separate OpenAPI clients** for different contexts:

#### Server-Side Client (`fetch.ts`)

```typescript
// src/util/fetch.ts - Use in Server Components and server actions
import { cookies } from 'next/headers';
import createClient from 'openapi-fetch';
import createReactQueryClient from 'openapi-react-query';
import { ENV } from '@/util/env';
import type { paths } from '@/util/openapiSchema';
import { createRateLimitHandler } from '@/util/retryWithBackoff';

const openAPIClient = createClient<paths>({
  baseUrl: ENV.BASE_API_URL,
});

openAPIClient.use({
  async onRequest({ request }) {
    const token = (await cookies()).get('token')?.value;
    if (token) {
      request.headers.set('authorization', `Bearer ${token}`);
    }
    return request;
  },
  onResponse: createRateLimitHandler(),
});

const $api = createReactQueryClient(openAPIClient);

export { $api, openAPIClient };
```

#### Client-Side Client (`clientFetch.ts`)

```typescript
// src/util/clientFetch.ts - Use in Client Components
import createClient from 'openapi-fetch';
import createReactQueryClient from 'openapi-react-query';
import type { paths } from '@/util/openapiSchema';
import { createRateLimitHandler } from '@/util/retryWithBackoff';

const openAPIClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_BASE_API_URL ?? '',
  credentials: 'include',  // Important: includes cookies
});

openAPIClient.use({
  onResponse: createRateLimitHandler(),
});

const $api = createReactQueryClient(openAPIClient);

export { $api, openAPIClient };
```

**When to use which:**
| Context | Import from | Auth handling |
|---------|-------------|---------------|
| Server Components, RSC pages | `@/util/fetch` | Cookie forwarding via `next/headers` |
| Client Components (`'use client'`) | `@/util/clientFetch` | `credentials: 'include'` |

### 2. Query Client Factory

The `getQueryClient()` function provides a singleton pattern for browser and fresh instances for server:

```typescript
// src/util/getQueryClient.ts
import { isServer, QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1_000,  // 60 seconds default
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();  // Fresh instance per request
  } else {
    browserQueryClient ??= makeQueryClient();  // Singleton in browser
    return browserQueryClient;
  }
}
```

**Important:** Always use `getQueryClient()`, never `new QueryClient()` directly.

### 3. Type-Safe Query Keys with `$api.queryOptions()`

Always use `$api.queryOptions()` to generate type-safe query configurations:

```typescript
// Client Component
import { useSuspenseQuery } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';

const { data } = useSuspenseQuery(
  $api.queryOptions('get', '/api/v1/project/{id}/', {
    params: { path: { id: projectUuid } },
  }),
);

// For invalidation - always use the generated queryKey
await queryClient.invalidateQueries({
  queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
    params: { path: { id: projectUuid } },
  }).queryKey,
});
```

**Never manually construct query keys** - always derive them from `$api.queryOptions()`.

## Data Fetching Patterns

### RSC Prefetching with HydrationBoundary

Server Components should prefetch data and pass it to client components via hydration:

```typescript
// src/app/(main)/(projects)/projects/page.tsx - Server Component
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { $api } from '@/util/fetch';  // Server client
import { getQueryClient } from '@/util/getQueryClient';
import { ProjectsView } from './ProjectsView';

export default async function Page({ searchParams }) {
  const { page, sort } = await searchParams;
  const queryClient = getQueryClient();

  // Prefetch on the server
  await queryClient.prefetchQuery(
    $api.queryOptions('get', '/api/v1/project/', {
      params: {
        query: { limit: 12, offset: (page - 1) * 12, ordering: sort },
      },
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsView limit={12} />
    </HydrationBoundary>
  );
}
```

```typescript
// src/app/(main)/(projects)/projects/ProjectsView.tsx - Client Component
'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { $api } from '@/util/clientFetch';  // Client client

export function ProjectsView(props: { readonly limit: number }) {
  const { data } = useSuspenseQuery(
    $api.queryOptions(
      'get',
      '/api/v1/project/',
      { params: { query: { limit: props.limit } } },
      { placeholderData: keepPreviousData },  // Smooth pagination
    ),
  );

  return <div>{/* render data */}</div>;
}
```

### Parallel Prefetching

When fetching multiple independent resources, parallelize with `Promise.all()`:

```typescript
const queryClient = getQueryClient();

await Promise.all([
  queryClient.prefetchQuery(
    $api.queryOptions('get', '/api/v1/project/{id}/', {
      params: { path: { id: projectUuid } },
    }),
  ),
  queryClient.prefetchQuery(
    $api.queryOptions('get', '/api/v1/project/{id}/folders/', {
      params: { path: { id: projectUuid } },
    }),
  ),
]);
```

## Mutation Patterns

### Reusable Mutation Hook

Create mutation hooks for consistent error handling and cache invalidation:

```typescript
// src/hooks/useProjectMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { globalToastQueue, ToastType } from '@/components/ui/Toast';
import { $api, openAPIClient } from '@/util/clientFetch';
import { formatErrorMessage } from '@/util/formatErrorMessage';
import { logger, LogCategory } from '@/util/logger';

type UseProjectUpdateMutationOptions = {
  onSuccess?(): void;
  readonly projectUuid: string;
  readonly toastMessages?: {
    readonly error?: string;
    readonly success?: string;
  };
};

export function useProjectUpdateMutation(options: UseProjectUpdateMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { error, response } = await openAPIClient.PATCH('/api/v1/project/{id}/', {
        params: { path: { id: options.projectUuid } },
        body: payload,
      });

      if (error) {
        throw new Error(formatErrorMessage(error, response));
      }
    },
    async onSuccess() {
      logger.info(LogCategory.Project, 'Project updated', {
        projectUuid: options.projectUuid,
      });

      // Parallelize invalidations
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
            params: { path: { id: options.projectUuid } },
          }).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: $api.queryOptions('get', '/api/v1/project/').queryKey,
        }),
      ]);

      if (options.toastMessages?.success) {
        globalToastQueue.add(
          { message: options.toastMessages.success, type: ToastType.Success },
          { timeout: 2_500 },
        );
      }

      options.onSuccess?.();
    },
    onError(error) {
      logger.error(LogCategory.Project, 'Failed to update project', {
        error: error.message,
        projectUuid: options.projectUuid,
      });

      globalToastQueue.add(
        {
          message: options.toastMessages?.error ?? 'Failed to update project.',
          type: ToastType.Error,
        },
        { timeout: 5_000 },
      );
    },
  });
}
```

### Optimistic Updates

For instant UI feedback, use `onMutate` with rollback on error:

```typescript
const { mutate } = useMutation({
  mutationFn: async (input) => {
    const { error, response } = await openAPIClient.POST('/api/v1/bulk-action/', {
      body: input,
    });
    if (error) throw new Error(formatErrorMessage(error, response));
    return input;
  },
  async onMutate() {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: draftsQueryKey });

    // 2. Snapshot current data for rollback
    const previousData = queryClient.getQueryData(draftsQueryKey);

    // 3. Optimistically update
    queryClient.setQueryData(draftsQueryKey, (old) => {
      if (!old?.results) return old;
      return {
        ...old,
        results: old.results.filter((item) => !selectedIds.includes(item.pk)),
      };
    });

    return { previousData };
  },
  async onSuccess() {
    await queryClient.invalidateQueries({ queryKey: draftsQueryKey });
  },
  onError(_error, _variables, context) {
    // 4. Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(draftsQueryKey, context.previousData);
    }
  },
});
```

## Rate Limiting Middleware

The codebase includes automatic retry with exponential backoff for 429 responses:

```typescript
// src/util/retryWithBackoff.ts
type RetryConfig = {
  readonly baseDelay?: number;   // Default: 1000ms
  readonly maxDelay?: number;    // Default: 30000ms
  readonly maxRetries?: number;  // Default: 5
};

export function createRateLimitHandler(config: RetryConfig = {}) {
  return async ({ request, response }) => {
    if (response.status !== 429) return response;

    const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '1', 10);
    let retryCount = 0;

    const attemptRetry = async () => {
      if (retryCount >= maxRetries) {
        throw new Error('Max retries reached');
      }

      const delay = Math.min(2 ** retryCount * baseDelay, maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
      retryCount++;

      const retryResponse = await fetch(request.url, { /* ... */ });
      return retryResponse.status === 429 ? attemptRetry() : retryResponse;
    };

    return attemptRetry();
  };
}
```

## Pagination with URL State

Use `nuqs` to sync pagination state with URL:

```typescript
'use client';

import { keepPreviousData, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { $api } from '@/util/clientFetch';

export function PaginatedList({ limit }: { readonly limit: number }) {
  const [queryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    sort: parseAsString.withDefault('name'),
  });

  const offset = (queryStates.page - 1) * limit;

  const { data } = useSuspenseQuery(
    $api.queryOptions(
      'get',
      '/api/v1/items/',
      { params: { query: { limit, offset, ordering: queryStates.sort } } },
      { placeholderData: keepPreviousData },  // Prevents loading flash
    ),
  );

  return (
    <>
      <Pagination
        count={data.count}
        length={data.results.length}
        limit={limit}
        offset={offset}
      />
      {/* Render items */}
      <Pagination {/* same props */} />
    </>
  );
}
```

## Common Gotchas

1. **Wrong client import**: Server Components use `@/util/fetch`, Client Components use `@/util/clientFetch`
2. **Manual query keys**: Never write `queryKey: ['project', id]` - always use `$api.queryOptions(...).queryKey`
3. **Missing credentials**: Client fetch needs `credentials: 'include'` for cookie auth
4. **Serial invalidations**: Always parallelize with `Promise.all([...invalidations])`
5. **New QueryClient**: Never use `new QueryClient()` - use `getQueryClient()`
6. **Stale closures**: Use refs when accessing values in mutation callbacks that change

## Documentation Links

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [openapi-fetch Docs](https://openapi-ts.dev/openapi-fetch/)
- [openapi-react-query Docs](https://openapi-ts.dev/openapi-react-query/)
- [nuqs Docs](https://nuqs.47ng.com/)
