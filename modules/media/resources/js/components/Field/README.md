# Asset Field Components

A collection of React components for handling asset/media fields in forms, similar to the Vue implementation provided. These components are built with shadcn/ui design patterns and provide drag & drop functionality.

## Components

### `SimpleAssetsField`

The main component for asset field input with full functionality.

### `AssetFieldTile`

Grid view component for individual assets.

### `AssetFieldRow`

List/table view component for individual assets.

### `useAssetsField` Hook

Custom hook that provides state management and handlers for asset fields.

## Usage

### Basic Usage

```tsx
import { SimpleAssetsField } from '@media/components/Field';
import { MediaAsset } from '@media/types/media';

function MyForm() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);

    return (
        <SimpleAssetsField
            name="Featured Images"
            data={assets}
            config={{
                container: 'public',
                folder: '/uploads',
                max_files: 5,
                mode: 'grid',
                canEdit: true,
            }}
            required={true}
            onChange={setAssets}
            onError={(error) => console.error(error)}
        />
    );
}
```

### With React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { SimpleAssetsField } from '@media/components/Field';

interface FormData {
    images: MediaAsset[];
}

function MyFormWithHookForm() {
    const { control, handleSubmit } = useForm<FormData>();

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
                name="images"
                control={control}
                render={({ field }) => (
                    <SimpleAssetsField
                        name="Product Images"
                        data={field.value || []}
                        config={{
                            container: 'public',
                            max_files: 10,
                            mode: 'grid',
                        }}
                        onChange={field.onChange}
                    />
                )}
            />
        </form>
    );
}
```

### Single Asset Field

```tsx
<SimpleAssetsField
    name="Avatar"
    data={[avatar]}
    config={{
        container: 'public',
        folder: '/avatars',
        max_files: 1, // This makes it a single asset field
        mode: 'grid',
        accept: 'image/*',
        maxFileSize: 2 * 1024 * 1024, // 2MB
    }}
    onChange={(assets) => setAvatar(assets[0])}
/>
```

### Using the Hook Directly

```tsx
import { useAssetsField } from '@media/hooks/useAssetsField';

function CustomAssetField() {
    const {
        assets,
        uploads,
        loading,
        showSelector,
        addAsset,
        removeAsset,
        openSelector,
        closeSelector,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    } = useAssetsField({
        config: {
            container: 'public',
            max_files: 5,
        },
        onChange: (assets) => console.log('Assets changed:', assets),
    });

    // Build your custom UI using the hook's state and handlers
    return (
        <div onDragOver={handleDragOver} onDrop={handleDrop}>
            {/* Your custom implementation */}
        </div>
    );
}
```

## Configuration Options

```typescript
interface AssetFieldConfig {
    container?: string; // Storage container (required)
    folder?: string; // Upload folder path
    max_files?: number; // Maximum number of files (0 = unlimited)
    restrict?: boolean; // Restrict navigation in selector
    mode?: 'grid' | 'list'; // Display mode
    canEdit?: boolean; // Allow editing assets
    accept?: string; // File type restrictions
    maxFileSize?: number; // Maximum file size in bytes
}
```

## Features

- ✅ Drag & drop file upload
- ✅ Asset browser/selector modal
- ✅ Grid and list view modes
- ✅ Single and multiple asset support
- ✅ File type restrictions
- ✅ Maximum file size validation
- ✅ Asset editing (when integrated with editor)
- ✅ Sortable assets (drag to reorder)
- ✅ Form validation integration
- ✅ shadcn/ui design consistency
- ✅ TypeScript support
- ✅ Accessibility features

## Integration with Existing Media Module

These components integrate seamlessly with the existing media module:

- Uses existing `MediaService` for API calls
- Reuses `Uploader`, `Uploads`, and `Selector` components
- Compatible with existing `MediaAsset` types
- Follows the same patterns as the browser components
