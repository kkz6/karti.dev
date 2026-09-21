import { usePage } from '@inertiajs/react';
import { AssetBrowser } from '@media/components/Browser/AssetBrowser';
import { MediaService } from '@media/services/MediaService';
import { MediaAsset } from '@media/types/media';
import { ImagePlusIcon } from '@shared/components/tiptap/tiptap-icons/image-plus-icon';
import { Button } from '@shared/components/tiptap/tiptap-ui-primitive/button';
import { Button as ShadcnButton } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { useTiptapEditor } from '@shared/hooks/use-tiptap-editor';
import { type SharedData } from '@shared/types';
import { type Editor } from '@tiptap/react';
import * as React from 'react';

interface MediaImageButtonProps {
    editor?: Editor | null;
}

export function MediaImageButton({ editor: providedEditor }: MediaImageButtonProps) {
    const { editor } = useTiptapEditor(providedEditor);
    const { mediaLibrary } = usePage<SharedData>().props;
    const [showDialog, setShowDialog] = React.useState(false);
    const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
    const mediaService = React.useRef(new MediaService());

    const canInsertImage = React.useMemo(() => {
        if (!editor || !editor.isEditable) return false;
        // Check for resizableImage extension first, fallback to regular image
        return editor.can().setImage?.({ src: '' }) || editor.can().insertContent({ type: 'resizableImage', attrs: { src: '' } });
    }, [editor]);

    const handleInsertImage = (asset: MediaAsset) => {
        if (!editor || !canInsertImage) return;

        // Try to use resizableImage if available, otherwise use regular image
        const inserted = editor
            .chain()
            .focus()
            .insertContent({
                type: 'resizableImage',
                attrs: {
                    src: asset.url,
                    alt: asset.alt || asset.filename || '',
                    title: asset.title || asset.filename || '',
                    width: asset.dimensions?.width,
                    height: asset.dimensions?.height,
                    alignment: 'center',
                },
            })
            .run();

        // Fallback to regular image if resizableImage is not available
        if (!inserted) {
            editor
                .chain()
                .focus()
                .setImage({
                    src: asset.url,
                    alt: asset.alt || asset.filename || '',
                    title: asset.title || asset.filename || '',
                })
                .run();
        }

        setShowDialog(false);
        setSelectedAssets([]);
    };

    const handleAssetDoubleClicked = (asset: MediaAsset) => {
        handleInsertImage(asset);
    };

    const handleSelectionsUpdated = (selections: string[]) => {
        setSelectedAssets(selections);
    };

    const handleSelectAsset = async () => {
        // Get asset data by ID using MediaService
        if (selectedAssets.length > 0) {
            try {
                const assetId = selectedAssets[0];
                const assetData = await mediaService.current.getFileDetails(parseInt(assetId));
                if (assetData) {
                    handleInsertImage(assetData);
                }
            } catch (error) {
                console.error('Error fetching asset data:', error);
            }
        }
    };

    if (!canInsertImage) {
        return null;
    }

    return (
        <>
            <Button type="button" data-style="ghost" onClick={() => setShowDialog(true)} aria-label="Insert image" tooltip="Insert image">
                <ImagePlusIcon className="tiptap-button-icon" />
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="flex h-[85vh] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl md:max-w-6xl lg:max-w-6xl">
                    <DialogHeader className="flex-shrink-0 border-b px-4 py-3">
                        <DialogTitle>Select Image</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-0">
                        <AssetBrowser
                            selectedContainer={mediaLibrary.defaultDisk}
                            selectedPath="/"
                            selectedAssets={selectedAssets}
                            maxFiles={1}
                            canEdit={true}
                            onSelectionsUpdated={handleSelectionsUpdated}
                            onAssetDoubleClicked={handleAssetDoubleClicked}
                        />
                    </div>

                    <DialogFooter className="bg-muted/20 flex-shrink-0 border-t px-4 py-3">
                        <ShadcnButton type="button" variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </ShadcnButton>
                        <ShadcnButton type="button" onClick={handleSelectAsset} disabled={selectedAssets.length === 0}>
                            Select Image
                        </ShadcnButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
