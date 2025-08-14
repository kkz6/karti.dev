# Media Manager - Vue to React Migration

## Overview

This directory contains the migrated Media Manager from Vue.js to React with TypeScript, utilizing shadcn/ui components and Tailwind CSS.

## Migration Status

### ✅ Completed

- **Vue Source Code Copied**: All original Vue components, modules, and assets copied from Laravel Media Manager
- **React Component Structure**: Created modern React component with TypeScript
- **Custom Hooks**: Converted Vue mixins to React hooks
- **Utility Functions**: Migrated Vue utility methods to TypeScript functions
- **Keyboard Shortcuts**: Implemented keyboard navigation and shortcuts
- **File Operations**: Created hooks for file upload, operations, and management

### 📁 Directory Structure

```
js/
├── components/
│   ├── MediaManager.tsx          # Main React component (converted from manager.vue)
│   ├── globalSearch/             # Vue components (to be converted)
│   ├── image/                    # Vue components (to be converted)
│   ├── toolbar/                  # Vue components (to be converted)
│   ├── usageIntro/              # Vue components (to be converted)
│   └── utils/                   # Vue components (to be converted)
├── hooks/
│   ├── useFileUpload.ts         # File upload functionality
│   ├── useFileOperations.ts     # CRUD operations for files
│   ├── useKeyboardShortcuts.ts  # Keyboard navigation and shortcuts
│   └── index.ts                 # Hook exports
├── utils/
│   └── fileUtils.ts             # File utility functions
├── modules/                     # Original Vue modules (reference)
├── mixins/                      # Original Vue mixins (reference)
├── packages/                    # Original JavaScript packages
├── webworkers/                  # Original web workers
└── index.ts                     # Main exports
```

### 🎯 Key Features Implemented

#### React MediaManager Component

- **File Grid/List View**: Responsive file browser with card-based layout
- **File Selection**: Single and bulk selection with visual feedback
- **Search & Filter**: Real-time file search and filtering
- **Upload Interface**: Drag & drop and button-based file upload
- **File Operations**: Delete, rename, move, lock, visibility toggle
- **Info Sidebar**: Detailed file information panel
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Progress Indicators**: Upload and operation progress feedback

#### Custom Hooks

- **useFileUpload**: Handles file uploads with progress tracking
- **useFileOperations**: CRUD operations for files and folders
- **useKeyboardShortcuts**: Keyboard navigation and shortcuts
- **useFileNavigation**: Arrow key navigation through file grid

#### Utility Functions

- **File Type Detection**: Intelligent file type identification
- **File Size Formatting**: Human-readable file size display
- **File Sorting**: Configurable sorting by name, size, type, date
- **File Filtering**: Search and type-based filtering
- **Preview URL Generation**: File preview handling

### 🎨 UI Components Used (shadcn/ui)

- `Button` - File operations and toolbar actions
- `Input` - Search and form inputs
- `Card` - File item containers
- `ScrollArea` - Scrollable content areas
- `Separator` - Visual dividers
- `Badge` - File status indicators
- `Tooltip` - Helpful hover information

### ⌨️ Keyboard Shortcuts

| Key             | Action                     |
| --------------- | -------------------------- |
| `U`             | Upload files               |
| `R`             | Refresh file list          |
| `D` / `Delete`  | Delete selected files      |
| `F2`            | Rename selected file       |
| `E`             | Edit selected image        |
| `B`             | Toggle bulk selection      |
| `A`             | Select all (in bulk mode)  |
| `M` / `P`       | Move selected files        |
| `L`             | Toggle file lock           |
| `V`             | Toggle file visibility     |
| `T`             | Toggle info sidebar        |
| `Esc`           | Cancel current action      |
| `Enter`         | Open folder/confirm action |
| `Backspace`     | Go up one directory        |
| `←` `→` `↑` `↓` | Navigate files             |
| `/`             | Focus search input         |

### 🔧 Integration Instructions

#### 1. Import the Component

```tsx
import { MediaManager } from '@/modules/media/resources/js';

// In your React component
<MediaManager
    config={config}
    routes={routes}
    translations={translations}
    // ... other props
/>;
```

#### 2. Required Props

```typescript
interface MediaManagerProps {
    config: {
        baseUrl: string;
        hideFilesExt: boolean;
        mimeTypes: Record<string, string[]>;
        broadcasting: boolean;
        gfi: boolean;
        ratioBar: boolean;
        previewFilesBeforeUpload: boolean;
    };
    routes: {
        files: string;
        lock: string;
        visibility: string;
        upload: string;
        locked_list: string;
    };
    translations: Record<string, string>;
    // Optional props...
}
```

### 📝 Next Steps (TODO)

1. **Convert Remaining Vue Components**:
    - Image editor components
    - Global search components
    - Toolbar components
    - Utility components

2. **Add Advanced Features**:
    - Image editor integration
    - Video/audio preview
    - Batch operations modal
    - Upload progress modal
    - File preview modal

3. **Optimize Performance**:
    - Virtual scrolling for large file lists
    - Image lazy loading
    - Caching strategies

4. **Add Tests**:
    - Unit tests for hooks
    - Integration tests for components
    - E2E tests for workflows

### 🚀 Usage Example

```tsx
import React from 'react';
import { MediaManager } from '@/modules/media/resources/js';

const MediaPage = () => {
    const config = {
        baseUrl: '/media',
        hideFilesExt: false,
        mimeTypes: {},
        broadcasting: false,
        gfi: true,
        ratioBar: true,
        previewFilesBeforeUpload: true,
    };

    const routes = {
        files: '/api/media/files',
        lock: '/api/media/lock',
        visibility: '/api/media/visibility',
        upload: '/api/media/upload',
        locked_list: '/api/media/locked',
    };

    const translations = {
        upload: 'Upload',
        delete: 'Delete',
        rename: 'Rename',
        // ... more translations
    };

    return (
        <div className="h-screen">
            <MediaManager config={config} routes={routes} translations={translations} />
        </div>
    );
};

export default MediaPage;
```

### 📚 Original Vue Files

All original Vue files are preserved in their respective directories for reference during the migration process. These can be used to understand the original functionality and ensure feature parity in the React implementation.

---

**Note**: This is the initial React implementation. The original Vue components serve as a reference for completing the full migration with all advanced features like image editing, advanced modals, and broadcasting functionality.
