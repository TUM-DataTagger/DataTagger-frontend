# Documentation

Reference documentation for libraries and patterns used in this codebase.

## Structure

```
docs/
  feature-flags.md    # Feature flag release/rollback operations runbook
  libraries/          # Library-specific guides and patterns
    orpc.md           # oRPC server actions
    react-query.md    # Data fetching with React Query + OpenAPI
    react-aria.md     # UI components with React Aria + CVA
    websocket.md      # Real-time WebSocket communication
    jotai.md          # Client state management
    tus-upload.md     # Resumable file uploads
```

## Libraries

| Library | Guide | Description |
|---------|-------|-------------|
| [oRPC](https://orpc.dev) | [orpc.md](./libraries/orpc.md) | Type-safe server actions with middleware |
| [React Query](https://tanstack.com/query) | [react-query.md](./libraries/react-query.md) | Data fetching, caching, and mutations |
| [React Aria](https://react-spectrum.adobe.com/react-aria) | [react-aria.md](./libraries/react-aria.md) | Accessible UI components with CVA styling |
| WebSocket | [websocket.md](./libraries/websocket.md) | Real-time updates and file locking |
| [Jotai](https://jotai.org) | [jotai.md](./libraries/jotai.md) | Client-side state management |
| [TUS](https://tus.io) | [tus-upload.md](./libraries/tus-upload.md) | Resumable file upload protocol |

## Operations

| Topic | Guide | Description |
|-------|-------|-------------|
| Feature flags | [feature-flags.md](./feature-flags.md) | Global release, rollback, and developer override workflow |

## Quick Reference

### Data Flow

```
Server Data: OpenAPI → React Query → Components
Client State: Jotai atoms → Components
Real-time: WebSocket → Context → Components
Uploads: TUS → Jotai queue → Components
Server Actions: oRPC → Next.js actions
```

### Key Patterns

- **Dual OpenAPI clients**: `@/util/fetch` (server) vs `@/util/clientFetch` (client)
- **Type-safe queries**: Always use `$api.queryOptions()` for query keys
- **Split WebSocket contexts**: Stable (connection) vs reactive (messages)
- **Atom factories**: Create isolated atom instances for different contexts
- **CVA composition**: Combine `focusRing` + component styles with `compose()`

## Adding Documentation

When adding documentation for a new library:

1. Create a file in `docs/libraries/` named after the library (e.g., `new-library.md`)
2. Include: quick start, common patterns, gotchas, and links to official docs
3. Add code examples from the actual codebase with file paths
4. Update this README with a link to the new guide
