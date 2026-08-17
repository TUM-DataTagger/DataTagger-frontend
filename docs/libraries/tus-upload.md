# TUS Resumable File Uploads

> Guide for implementing resumable file uploads with TUS protocol in this codebase.

## Quick Start

### Installation

```bash
pnpm --filter @fdm-frontend/website add use-tus tus-js-client
```

## Core Concepts

### 1. TUS Protocol Overview

TUS (Tussin Uploadprotocol) enables resumable file uploads:
- **Resumable**: Uploads can be paused and resumed
- **Chunked**: Large files are split into smaller chunks
- **Reliable**: Network interruptions don't lose progress

### 2. Provider Setup

The TUS client is provided at the app level:

```typescript
// src/app/providers.tsx
'use client';

import { TusClientProvider } from 'use-tus';

export function Providers(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <TusClientProvider>
          {props.children}
        </TusClientProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
```

### 3. The `useTus` Hook

Access TUS functionality in components:

```typescript
import { useTus } from 'use-tus';

function UploadComponent() {
  const { setUpload } = useTus({
    autoStart: true,   // Start uploads immediately
    autoAbort: false,  // Don't auto-abort on errors
  });

  // setUpload(file, options) registers a file for upload
}
```

## Upload Implementation

### Basic Upload Trigger

```typescript
// src/components/UploadTrigger.tsx
'use client';

import { FileTrigger } from 'react-aria-components';
import { useTus } from 'use-tus';
import { useSetAtom } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import {
  globalUploadAssistantOpenAtom,
  globalUploadAssistantTabAtom,
  uploadsQueueAtom,
} from '@/stores/globalUploadAssistant';
import { openAPIClient, $api } from '@/util/clientFetch';
import { useEnv } from '@/contexts/Env';
import { logger, LogCategory } from '@/util/logger';

type UploadTriggerProps = PropsWithChildren<{
  readonly folderName?: string;
  readonly folderUuid?: string;
  readonly projectUuid?: string;
}>;

export function UploadTrigger(props: UploadTriggerProps) {
  const env = useEnv();
  const queryClient = useQueryClient();
  const { setUpload } = useTus({ autoStart: true, autoAbort: false });

  const setIsOpen = useSetAtom(globalUploadAssistantOpenAtom);
  const setTab = useSetAtom(globalUploadAssistantTabAtom);
  const setUploadsQueue = useSetAtom(uploadsQueueAtom);

  const onSelect = async (files: FileList | null) => {
    if (!files) return;

    // Open upload assistant UI
    setTab(props.folderUuid ? 'folders' : 'drafts');
    setIsOpen(true);

    for (const file of files) {
      // 1. Create dataset record on backend
      const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/', {
        body: {
          name: file.name,
          folder: props.folderUuid ?? null,
        },
      });

      // 2. Generate local tracking UUID
      const uuid = crypto.randomUUID();
      const startTime = performance.now();
      let lastLoggedMilestone = 0;

      // 3. Configure TUS upload
      setUpload(file, {
        endpoint: `${env.BASE_API_URL}/api/v1/uploads-dataset/${data?.pk}/tus/`,
        chunkSize: 50_000_000,  // 50MB chunks
        removeFingerprintOnSuccess: true,
        parallelUploads: 1,
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onBeforeRequest: (req) => {
          const xhr = req.getUnderlyingObject();
          xhr.withCredentials = true;  // Include auth cookies
        },
        onProgress: (bytesSent, bytesTotal) => {
          // Progress handling...
        },
        onSuccess: () => {
          // Success handling...
        },
        onError: (error, upload) => {
          // Error handling...
        },
      });

      // 4. Add to upload queue state
      setUploadsQueue((draft) => {
        draft.push({
          uuid,
          filename: file.name,
          percentComplete: 0,
          uploadSpeed: 0,
          finished: false,
          folderUuid: props.folderUuid,
          folderName: props.folderName,
          projectUuid: props.projectUuid,
          datasetUuid: data?.pk,
          tusUpload: /* the upload object */,
        });
      });
    }
  };

  return (
    <FileTrigger allowsMultiple onSelect={onSelect}>
      {props.children}
    </FileTrigger>
  );
}
```

### Progress Tracking

```typescript
onProgress(bytesSent, bytesTotal) {
  const percentComplete = (bytesSent / bytesTotal) * 100;
  const currentTime = performance.now();
  const elapsedTime = (currentTime - startTime) / 1_000;
  const uploadSpeed = bytesSent / elapsedTime;

  // Log at 25% milestones
  const milestone = Math.floor(percentComplete / 25) * 25;
  if (milestone > lastLoggedMilestone && milestone < 100) {
    logger.debug(LogCategory.Upload, `Upload ${milestone}% complete`, {
      filename: file.name,
      bytesSent,
      bytesTotal,
      uploadSpeed: `${(uploadSpeed / 1_024 / 1_024).toFixed(2)} MB/s`,
    });
    lastLoggedMilestone = milestone;
  }

  // Update queue state
  setUploadsQueue((draft) => {
    const upload = draft.find((up) => up.uuid === uuid);
    if (upload) {
      upload.percentComplete = percentComplete;
      upload.uploadSpeed = uploadSpeed;
    }
  });
}
```

### Success Handling

```typescript
async onSuccess() {
  const duration = ((performance.now() - startTime) / 1_000).toFixed(1);
  logger.info(LogCategory.Upload, 'Upload completed', {
    filename: file.name,
    uuid,
    duration: `${duration}s`,
  });

  // Update state
  setUploadsQueue((draft) => {
    const upload = draft.find((up) => up.uuid === uuid);
    if (upload) {
      upload.finished = true;
      upload.percentComplete = 100;
      upload.uploadSpeed = 0;
    }
  });

  // Invalidate relevant queries
  const invalidations: Promise<void>[] = [];

  if (props.projectUuid) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/api/v1/project/{id}/', {
          params: { path: { id: props.projectUuid } },
        }).queryKey,
      }),
    );
  }

  if (props.folderUuid) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/api/v1/folder/{id}/', {
          params: { path: { id: props.folderUuid } },
        }).queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/', {
          params: { query: { folder: props.folderUuid } },
        }).queryKey,
      }),
    );
  } else {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: $api.queryOptions('get', '/api/v1/uploads-dataset/').queryKey,
      }),
    );
  }

  await Promise.all(invalidations);
}
```

### Error Handling with Retry

```typescript
async onError(error, upload) {
  logger.error(LogCategory.Upload, 'Upload failed', {
    filename: file.name,
    error: error instanceof Error ? error.message : String(error),
  });

  await upload.abort();

  setUploadsQueue((draft) => {
    const queueItem = draft.find((up) => up.uuid === uuid);
    if (queueItem && !queueItem.finished) {
      queueItem.finished = false;
      queueItem.percentComplete = 0;
      queueItem.uploadSpeed = 0;
      queueItem.error = true;
    }
  });
}
```

## Upload Queue State

### State Shape

```typescript
// src/stores/globalUploadAssistant.ts
import { atom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import type { Key } from 'react-aria-components';
import type { Upload } from 'tus-js-client';

// UI state
export const globalUploadAssistantOpenAtom = atom(false);
export const globalUploadAssistantTabAtom = atom<Key>('drafts');

// Upload queue
export const uploadsQueueAtom = atomWithImmer<{
  readonly datasetUuid?: string;
  readonly directory?: string;
  readonly error?: boolean;
  readonly filename: string;
  readonly finished: boolean;
  readonly folderName?: string;
  readonly folderUuid?: string;
  readonly paused?: boolean;
  readonly percentComplete: number;
  readonly projectUuid?: string;
  readonly selected?: boolean;
  readonly tusUpload: Upload;
  readonly uploadSpeed: number;
  readonly uuid: string;
}[]>([]);
```

### Derived Atoms

```typescript
// Count active uploads
export const uploadsQueueLengthAtom = atom((get) =>
  get(uploadsQueueAtom).filter(
    (upload) => !upload.finished && !upload.error && !upload.paused
  ).length,
);

// Filter by destination
export const uploadsNoFolderAtom = atom((get) =>
  get(uploadsQueueAtom).filter((upload) => !upload.folderUuid)
);

export const uploadsIntoFolderAtom = atom((get) =>
  get(uploadsQueueAtom).filter((upload) => upload.folderUuid)
);

// Filter by status
export const finishedUploadsNoFolderAtom = atom((get) =>
  get(uploadsQueueAtom).filter((upload) => upload.finished && !upload.folderUuid)
);

export const unfinishedUploadsNoFolderAtom = atom((get) =>
  get(uploadsQueueAtom).filter((upload) => !upload.finished && !upload.folderUuid)
);

// Selection tracking
export const uploadsNoFolderSelectionAtom = atom((get) =>
  get(uploadsQueueAtom).filter((upload) => !upload.folderUuid && upload.selected)
);
```

## Retry Implementation

In the UI, allow users to retry failed uploads:

```typescript
// In upload list component
{upload.error ? (
  <Button
    aria-label="Retry upload"
    onPress={async () => {
      // Find previous upload attempts (TUS fingerprint)
      const previousUploads = await upload.tusUpload.findPreviousUploads();

      logger.info(LogCategory.Upload, 'Retrying upload', {
        filename: upload.filename,
        uuid: upload.uuid,
        previousUploadsFound: previousUploads.length,
      });

      // Resume from previous if available
      if (previousUploads.length) {
        upload.tusUpload.resumeFromPreviousUpload(previousUploads[0]!);
      }

      // Restart the upload
      upload.tusUpload.start();

      // Clear error state
      setUploadsQueue((draft) => {
        const entry = draft.find((up) => up.uuid === upload.uuid);
        if (entry?.error && !entry.finished) {
          entry.error = false;
        }
      });
    }}
    variant="unset"
  >
    <RotateCcwIcon aria-hidden size={18} />
  </Button>
) : null}
```

## Drag and Drop Upload

Alternative trigger using React Aria's DropZone:

```typescript
// src/app/(main)/GlobalDropZone.tsx
'use client';

import { DropZone, type DropEvent } from 'react-aria-components';
import { useTus } from 'use-tus';

export function GlobalDropZone() {
  const { setUpload } = useTus({ autoStart: true, autoAbort: false });

  const onDrop = async (ev: DropEvent) => {
    if (!ev.items.length) return;

    // Process dropped items (handles nested folders)
    const files = await Promise.all(
      ev.items.map(async (item) => ({
        item,
        directory: item.kind === 'file' ? await getDirectory(item) : undefined,
      }))
    );

    for (const { item, directory } of files) {
      if (item.kind !== 'file') continue;

      const file = await item.getFile();

      // Same upload flow as FileTrigger
      const { data } = await openAPIClient.POST('/api/v1/uploads-dataset/', {
        body: { name: file.name },
      });

      setUpload(file, {
        endpoint: `${env.BASE_API_URL}/api/v1/uploads-dataset/${data?.pk}/tus/`,
        metadata: {
          filename: file.name,
          filetype: file.type,
          filepath: directory ?? '',  // Preserve folder structure
        },
        // ... callbacks
      });
    }
  };

  return (
    <DropZone
      onDrop={onDrop}
      onDropEnter={() => setDropZoneVisible(true)}
      onDropExit={() => setDropZoneVisible(false)}
    >
      <div className="drop-overlay">
        Drop files to upload
      </div>
    </DropZone>
  );
}
```

## UI Display

### Progress Bar

```typescript
import { ProgressBar } from '@/components/ui/ProgressBar';

function UploadItem({ upload }) {
  return (
    <div className="upload-item">
      <span>{upload.filename}</span>

      {upload.percentComplete > 0 && !upload.finished && !upload.error ? (
        <ProgressBar
          aria-label="Upload progress"
          value={upload.percentComplete}
        />
      ) : null}

      {upload.finished && <CheckIcon className="text-green-500" />}
      {upload.error && <XIcon className="text-red-500" />}
    </div>
  );
}
```

### Upload Speed Display

```typescript
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond > 1_024 * 1_024) {
    return `${(bytesPerSecond / 1_024 / 1_024).toFixed(1)} MB/s`;
  }
  return `${(bytesPerSecond / 1_024).toFixed(1)} KB/s`;
}

function UploadSpeed({ upload }) {
  if (upload.finished || upload.error || upload.uploadSpeed === 0) {
    return null;
  }

  return <span>{formatSpeed(upload.uploadSpeed)}</span>;
}
```

## Logging Integration

Use structured logging for upload events:

```typescript
import { logger, LogCategory } from '@/util/logger';

// Registration
logger.debug(LogCategory.Upload, 'Upload registered', {
  filename: file.name,
  fileSize: file.size,
  uuid,
  folderUuid: props.folderUuid ?? 'drafts',
});

// Progress milestones
logger.debug(LogCategory.Upload, `Upload 50% complete`, {
  filename: file.name,
  bytesSent,
  bytesTotal,
  uploadSpeed: `${(speed / 1_024 / 1_024).toFixed(2)} MB/s`,
});

// Completion
logger.info(LogCategory.Upload, 'Upload completed', {
  filename: file.name,
  uuid,
  duration: `${duration}s`,
});

// Errors
logger.error(LogCategory.Upload, 'Upload failed', {
  filename: file.name,
  error: error.message,
});
```

## Common Gotchas

1. **Missing credentials**: Set `xhr.withCredentials = true` in `onBeforeRequest`
2. **Wrong endpoint**: Endpoint must match backend TUS handler path
3. **Large chunk sizes**: 50MB is good for most networks; reduce for slower connections
4. **Forgetting to abort**: Call `upload.abort()` on errors before retrying
5. **State sync**: Keep Jotai state and TUS upload object in sync
6. **Missing fingerprint cleanup**: Use `removeFingerprintOnSuccess: true`

## Documentation Links

- [TUS Protocol](https://tus.io/)
- [tus-js-client](https://github.com/tus/tus-js-client)
- [use-tus](https://github.com/dusanjovanov/use-tus)
- [React Aria FileTrigger](https://react-spectrum.adobe.com/react-aria/FileTrigger.html)
- [React Aria DropZone](https://react-spectrum.adobe.com/react-aria/DropZone.html)
