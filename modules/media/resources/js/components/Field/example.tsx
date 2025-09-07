import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MediaAsset } from '../../types/media';
import { SimpleAssetsField } from './SimpleAssetsField';

// Example 1: Basic usage with state
export function BasicAssetFieldExample() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Asset Field</h2>
            <SimpleAssetsField
                name="Product Images"
                data={assets}
                config={{
                    container: 'public',
                    folder: '/products',
                    max_files: 5,
                    mode: 'grid',
                    canEdit: true,
                }}
                required={true}
                onChange={setAssets}
                onError={(error) => console.error('Asset field error:', error)}
            />

            <div className="mt-4">
                <p className="text-sm text-gray-600">Selected assets: {assets.length}</p>
                {assets.length > 0 && (
                    <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(
                            assets.map((a) => ({ id: a.id, filename: a.filename })),
                            null,
                            2,
                        )}
                    </pre>
                )}
            </div>
        </div>
    );
}

// Example 2: Single asset field (avatar/logo)
export function SingleAssetFieldExample() {
    const [avatar, setAvatar] = useState<MediaAsset | null>(null);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Single Asset Field (Avatar)</h2>
            <SimpleAssetsField
                name="Profile Avatar"
                data={avatar ? [avatar] : []}
                config={{
                    container: 'public',
                    folder: '/avatars',
                    max_files: 1, // This makes it a single asset field
                    mode: 'grid',
                    accept: 'image/*',
                    maxFileSize: 2 * 1024 * 1024, // 2MB
                }}
                onChange={(assets) => setAvatar(assets[0] || null)}
                onError={(error) => console.error('Avatar upload error:', error)}
            />

            {avatar && (
                <div className="mt-4">
                    <p className="text-sm text-gray-600">Selected avatar: {avatar.filename}</p>
                    <img
                        src={avatar.thumbnail_url || avatar.url}
                        alt={avatar.title || avatar.filename}
                        className="mt-2 h-20 w-20 rounded-full object-cover"
                    />
                </div>
            )}
        </div>
    );
}

// Example 3: Using with React Hook Form
interface FormData {
    title: string;
    images: MediaAsset[];
    featured_image: MediaAsset | null;
}

export function ReactHookFormExample() {
    const { control, handleSubmit, watch } = useForm<FormData>({
        defaultValues: {
            title: '',
            images: [],
            featured_image: null,
        },
    });

    const watchedImages = watch('images');
    const watchedFeatured = watch('featured_image');

    const onSubmit = (data: FormData) => {
        console.log('Form submitted:', data);
        // Handle form submission
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">React Hook Form Integration</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Title</label>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Enter title..."
                            />
                        )}
                    />
                </div>

                <Controller
                    name="featured_image"
                    control={control}
                    render={({ field }) => (
                        <SimpleAssetsField
                            name="Featured Image"
                            data={field.value ? [field.value] : []}
                            config={{
                                container: 'public',
                                folder: '/featured',
                                max_files: 1,
                                mode: 'grid',
                                accept: 'image/*',
                            }}
                            onChange={(assets) => field.onChange(assets[0] || null)}
                        />
                    )}
                />

                <Controller
                    name="images"
                    control={control}
                    render={({ field }) => (
                        <SimpleAssetsField
                            name="Gallery Images"
                            data={field.value || []}
                            config={{
                                container: 'public',
                                folder: '/gallery',
                                max_files: 10,
                                mode: 'grid',
                                accept: 'image/*',
                            }}
                            onChange={field.onChange}
                        />
                    )}
                />

                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Submit Form
                </button>
            </form>

            <div className="mt-6 rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 font-medium">Form State:</h3>
                <div className="space-y-1 text-sm">
                    <p>Featured Image: {watchedFeatured?.filename || 'None'}</p>
                    <p>Gallery Images: {watchedImages?.length || 0} selected</p>
                </div>
            </div>
        </div>
    );
}

// Example 4: List view mode
export function ListViewExample() {
    const [documents, setDocuments] = useState<MediaAsset[]>([]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">List View Mode</h2>
            <SimpleAssetsField
                name="Document Attachments"
                data={documents}
                config={{
                    container: 'public',
                    folder: '/documents',
                    mode: 'list', // Use list view instead of grid
                    accept: '.pdf,.doc,.docx,.txt',
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                }}
                onChange={setDocuments}
                onError={(error) => console.error('Document upload error:', error)}
            />
        </div>
    );
}
