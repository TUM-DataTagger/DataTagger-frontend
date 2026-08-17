# Jotai Client State Management

> Guide for managing client-side state with Jotai in this codebase.

## Quick Start

### Installation

```bash
pnpm --filter @fdm-frontend/website add jotai jotai-immer
```

## Core Concepts

### 1. Store Organization

All Jotai atoms are organized in `src/stores/`:

```
src/stores/
├── cmdk.ts                          # Command palette state
├── createProject.ts                 # Project creation workflow
├── editProjectFolderPermissions.ts  # Folder permission editing
├── editProjectMembers.ts            # Project member management
├── globalDropZone.ts                # Drag-and-drop zones
├── globalUploadAssistant.ts         # Upload queue state
├── memberFilters.ts                 # Reusable member filtering logic
├── projectFolderAtomFactory.ts      # Factory pattern for related atoms
└── sideSheet.ts                     # Side sheet UI state
```

### 2. Basic Atoms

Simple state containers:

```typescript
// src/stores/globalDropZone.ts
import { atom } from 'jotai';

export const globalDropZoneOpenAtom = atom(false);
export const folderDropZoneOpenAtom = atom(false);
```

```typescript
// src/stores/sideSheet.ts
import { atom } from 'jotai';

export const enum SideSheetMode {
  Dataset,
  FileVersionHistory,
  MetadataTemplateVersionHistory,
}

export const sideSheetModeAtom = atom<SideSheetMode>(SideSheetMode.Dataset);
export const sideSheetSelectedDatasetAtom = atom<string | null>(null);
```

### 3. Atoms with Immer

For complex state that benefits from mutable-style updates:

```typescript
// src/stores/globalUploadAssistant.ts
import { atomWithImmer } from 'jotai-immer';
import type { Upload } from 'tus-js-client';

export const uploadsQueueAtom = atomWithImmer<{
  readonly datasetUuid?: string | undefined;
  readonly error?: boolean;
  readonly filename: string;
  readonly finished: boolean;
  readonly folderUuid?: string | undefined;
  readonly paused?: boolean;
  readonly percentComplete: number;
  readonly tusUpload: Upload;
  readonly uploadSpeed: number;
  readonly uuid: string;
}[]>([]);
```

**Usage with Immer syntax:**
```typescript
const setUploadsQueue = useSetAtom(uploadsQueueAtom);

// Mutation-style update (Immer handles immutability)
setUploadsQueue((draft) => {
  const upload = draft.find((up) => up.uuid === uuid);
  if (upload) {
    upload.percentComplete = 50;
    upload.uploadSpeed = 1024;
  }
});
```

### 4. Enable Map/Set Support

For atoms containing `Set` or `Map`, enable Immer's support:

```typescript
// src/stores/projectFolderAtomFactory.ts
import { enableArrayMethods, enableMapSet } from 'immer';
import { atomWithImmer } from 'jotai-immer';

enableMapSet();
enableArrayMethods();

type ProjectFolderState = {
  project: {
    members: Set<string>;  // Now works with Immer
    memberPermission: Record<string, 'admin' | 'member' | undefined>;
  };
  folder: {
    members: Set<string>;
    metadata: FolderMetadataEntry[];
  };
};

const projectAtom = atomWithImmer<ProjectFolderState>(initialState);
```

## Derived Atoms

### Using `selectAtom`

Extract nested properties to avoid unnecessary re-renders:

```typescript
// src/stores/projectFolderAtomFactory.ts
import { selectAtom } from 'jotai/utils';

const projectAtom = atomWithImmer<ProjectFolderState>(initialState);

// Select specific nested values
const projectMembersAtom = selectAtom(projectAtom, (state) => state.project.members);
const projectMemberPermissionAtom = selectAtom(projectAtom, (state) => state.project.memberPermission);
const folderMembersAtom = selectAtom(projectAtom, (state) => state.folder.members);
```

**Why `selectAtom`?** Components subscribing to `projectMembersAtom` only re-render when `project.members` changes, not when other parts of the state change.

### Computed Atoms

Create read-only atoms that derive from other atoms:

```typescript
// src/stores/globalUploadAssistant.ts
import { atom } from 'jotai';

export const uploadsQueueAtom = atomWithImmer<Upload[]>([]);

// Count active uploads
export const uploadsQueueLengthAtom = atom((get) =>
  get(uploadsQueueAtom).filter(
    (upload) => !upload.finished && !upload.error && !upload.paused
  ).length,
);

// Filter by location
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
```

## Atom Factory Pattern

For isolated atom instances (e.g., create vs. edit workflows):

```typescript
// src/stores/projectFolderAtomFactory.ts
import { atom } from 'jotai';
import { atomWithImmer } from 'jotai-immer';
import { selectAtom } from 'jotai/utils';

function createInitialState(): ProjectFolderState {
  return {
    project: {
      members: new Set(),
      memberPermission: {},
      extendedMemberPermissions: {},
      name: '',
    },
    folder: {
      members: new Set(),
      memberPermission: {},
      metadata: [],
      name: '',
      storage: '',
    },
  };
}

export function createProjectFolderAtoms() {
  const initialState = createInitialState();
  const stepAtom = atom(0);
  const projectAtom = atomWithImmer<ProjectFolderState>(initialState);

  // Create derived atoms
  const projectMembersAtom = selectAtom(projectAtom, (state) => state.project.members);
  const projectMemberPermissionAtom = selectAtom(projectAtom, (state) => state.project.memberPermission);
  const folderMembersAtom = selectAtom(projectAtom, (state) => state.folder.members);
  const folderMemberPermissionAtom = selectAtom(projectAtom, (state) => state.folder.memberPermission);

  // Return all atoms as a bundle
  return {
    initialState,
    stepAtom,
    projectAtom,
    projectMembersAtom,
    projectMemberPermissionAtom,
    folderMembersAtom,
    folderMemberPermissionAtom,
    // ... more atoms
  };
}
```

**Usage in different contexts:**

```typescript
// src/stores/createProject.ts - For project creation
import { createProjectFolderAtoms } from './projectFolderAtomFactory';

const atoms = createProjectFolderAtoms();
export const { stepAtom, projectAtom, projectMembersAtom } = atoms;

// src/stores/editProjectFolderPermissions.ts - For editing (separate instance)
import { createProjectFolderAtoms } from './projectFolderAtomFactory';

const atoms = createProjectFolderAtoms();
export const { stepAtom, projectAtom, projectMembersAtom } = atoms;
```

## Reusable Atom Factories

Create functions that generate computed atoms for common patterns:

```typescript
// src/stores/memberFilters.ts
import { type Atom, atom } from 'jotai';

type MemberEntry = { id: string; name: string };
type ProjectPermission = 'admin' | 'member';
type FolderPermission = 'viewer' | 'editor';

/**
 * Creates a derived atom that filters members to only admins
 */
export function createProjectMembersWithAdminAtom(
  membersAtom: Atom<Set<string>>,
  permissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
): Atom<MemberEntry[]> {
  return atom((get) => {
    const members = get(membersAtom);
    const permissions = get(permissionsAtom);
    const admins: MemberEntry[] = [];

    for (const member of members) {
      if (permissions[member] === 'admin') {
        admins.push({ id: member, name: member });
      }
    }

    return admins;
  });
}

/**
 * Creates a derived atom that filters members to non-admins
 */
export function createProjectMembersWithoutAdminAtom(
  membersAtom: Atom<Set<string>>,
  permissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
): Atom<MemberEntry[]> {
  return atom((get) => {
    const members = get(membersAtom);
    const permissions = get(permissionsAtom);
    const nonAdmins: MemberEntry[] = [];

    for (const member of members) {
      if (permissions[member] !== 'admin') {
        nonAdmins.push({ id: member, name: member });
      }
    }

    return nonAdmins;
  });
}

/**
 * Creates a derived atom with full permission details
 */
export function createProjectMembersWithFullPermissionsAtom(
  projectMembersAtom: Atom<Set<string>>,
  projectPermissionsAtom: Atom<Record<string, ProjectPermission | undefined>>,
  extendedPermissionsAtom: Atom<Record<string, ExtendedPermissions>>,
  folderPermissionsAtom: Atom<Record<string, FolderPermission | undefined>>,
): Atom<MemberWithFullPermissions[]> {
  return atom((get) => {
    const projectMembers = get(projectMembersAtom);
    const projectPermissions = get(projectPermissionsAtom);
    const extendedPermissions = get(extendedPermissionsAtom);
    const folderPermissions = get(folderPermissionsAtom);

    return Array.from(projectMembers).map((member) => ({
      id: member,
      name: member,
      projectPermission: projectPermissions[member] ?? 'member',
      projectExtendedPermissions: extendedPermissions[member] ?? {},
      folderPermission: folderPermissions[member] ?? 'viewer',
    }));
  });
}
```

**Usage in atom factory:**
```typescript
export function createProjectFolderAtoms() {
  const projectAtom = atomWithImmer<ProjectFolderState>(initialState);
  const projectMembersAtom = selectAtom(projectAtom, (s) => s.project.members);
  const projectPermissionAtom = selectAtom(projectAtom, (s) => s.project.memberPermission);

  // Use the reusable factory
  const projectMembersWithAdminAtom = createProjectMembersWithAdminAtom(
    projectMembersAtom,
    projectPermissionAtom,
  );

  return { projectAtom, projectMembersAtom, projectMembersWithAdminAtom };
}
```

## Component Usage

### Reading Atoms

```typescript
'use client';

import { useAtomValue } from 'jotai';
import { uploadsQueueLengthAtom } from '@/stores/globalUploadAssistant';

function UploadBadge() {
  const uploadCount = useAtomValue(uploadsQueueLengthAtom);

  if (uploadCount === 0) return null;
  return <span className="badge">{uploadCount}</span>;
}
```

### Writing Atoms

```typescript
'use client';

import { useSetAtom } from 'jotai';
import { globalUploadAssistantOpenAtom } from '@/stores/globalUploadAssistant';

function OpenUploadsButton() {
  const setOpen = useSetAtom(globalUploadAssistantOpenAtom);

  return (
    <Button onPress={() => setOpen(true)}>
      View Uploads
    </Button>
  );
}
```

### Reading and Writing

```typescript
'use client';

import { useAtom } from 'jotai';
import { sideSheetSelectedDatasetAtom } from '@/stores/sideSheet';

function DatasetSelector() {
  const [selected, setSelected] = useAtom(sideSheetSelectedDatasetAtom);

  return (
    <Select
      selectedKey={selected}
      onSelectionChange={(key) => setSelected(key as string)}
    >
      {/* options */}
    </Select>
  );
}
```

### Updating Immer Atoms

```typescript
'use client';

import { useSetAtom } from 'jotai';
import { uploadsQueueAtom } from '@/stores/globalUploadAssistant';

function UploadProgress({ uuid }: { uuid: string }) {
  const setQueue = useSetAtom(uploadsQueueAtom);

  const updateProgress = (percent: number) => {
    setQueue((draft) => {
      const upload = draft.find((u) => u.uuid === uuid);
      if (upload) {
        upload.percentComplete = percent;
      }
    });
  };

  // ...
}
```

## Best Practices

### 1. Always Type Your Atoms

```typescript
// Good
export const countAtom = atom<number>(0);
export const itemsAtom = atomWithImmer<Item[]>([]);

// Avoid
export const countAtom = atom(0);  // Type inferred but less clear
```

### 2. Use `selectAtom` for Nested State

```typescript
// Good - only re-renders when project.name changes
const projectNameAtom = selectAtom(projectAtom, (state) => state.project.name);

// Avoid - re-renders on any projectAtom change
function Component() {
  const project = useAtomValue(projectAtom);
  return <span>{project.project.name}</span>;
}
```

### 3. Prefer `useAtomValue`/`useSetAtom` Over `useAtom`

```typescript
// Good - clear intent
const count = useAtomValue(countAtom);      // Read only
const setCount = useSetAtom(countAtom);     // Write only

// Use when you need both
const [count, setCount] = useAtom(countAtom);
```

### 4. Co-locate Related Atoms

Keep atoms that work together in the same file with clear exports.

## Common Gotchas

1. **Forgetting `enableMapSet()`**: Required before using `Set` or `Map` with Immer
2. **Creating atoms in components**: Always define atoms outside components at module level
3. **Not using factories for isolation**: Use `createProjectFolderAtoms()` pattern when same structure needs multiple instances
4. **Over-subscribing**: Use `selectAtom` to subscribe to specific nested values
5. **Missing types**: Always provide generic types to atoms

## Documentation Links

- [Jotai Documentation](https://jotai.org/)
- [jotai-immer](https://jotai.org/docs/integrations/immer)
- [Immer Documentation](https://immerjs.github.io/immer/)
