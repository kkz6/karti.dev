import * as React from 'react';
import { type Editor } from '@tiptap/react';
import { Button } from '@shared/components/tiptap/tiptap-ui-primitive/button';
import { ImagePlusIcon } from '@shared/components/tiptap/tiptap-icons/image-plus-icon';
import { useTiptapEditor } from '@shared/hooks/use-tiptap-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog';
import { Button as ShadcnButton } from '@shared/components/ui/button';
import { AssetBrowser } from '@media/components/Browser/AssetBrowser';
import { MediaAsset } from '@media/types/media';
import { MediaService } from '@media/services/MediaService';

interface MediaImageButtonProps {
  text?: string;
  editor?: Editor | null;
}

export function MediaImageButton({ text = 'Image', editor: providedEditor }: MediaImageButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [showDialog, setShowDialog] = React.useState(false);
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const mediaService = React.useRef(new MediaService());

  const canInsertImage = React.useMemo(() => {
    if (!editor || !editor.isEditable) return false;
    // Check for resizableImage extension first, fallback to regular image
    return editor.can().setImage?.({ src: '' }) || 
           editor.can().insertContent({ type: 'resizableImage', attrs: { src: '' } });
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
          // Convert MediaFile to MediaAsset format
          const asset: MediaAsset = {
            id: assetData.id.toString(),
            disk: assetData.disk,
            directory: assetData.directory,
            filename: assetData.filename,
            extension: assetData.extension,
            mime_type: assetData.mime_type,
            aggregate_type: assetData.aggregate_type,
            size: assetData.size,
            created_at: assetData.created_at,
            updated_at: assetData.updated_at,
            url: assetData.url,
            container_id: assetData.disk,
            is_image: assetData.aggregate_type === 'image',
            is_audio: assetData.aggregate_type === 'audio',
            is_video: assetData.aggregate_type === 'video',
            path: `${assetData.directory}/${assetData.filename}`,
            formatted_size: `${(assetData.size / 1024).toFixed(2)} KB`,
          };
          handleInsertImage(asset);
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
      <Button
        type="button"
        data-style="ghost"
        onClick={() => setShowDialog(true)}
        aria-label="Insert image"
      >
        <ImagePlusIcon className="tiptap-button-icon" />
        {text && <span className="tiptap-button-text">{text}</span>}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden p-0">
            <AssetBrowser
              selectedContainer="public"
              selectedPath="blog/content-images"
              selectedAssets={selectedAssets}
              maxFiles={1}
              canEdit={true}
              onSelectionsUpdated={handleSelectionsUpdated}
              onAssetDoubleClicked={handleAssetDoubleClicked}
            />
          </div>

          <DialogFooter className="px-4 py-3 border-t flex-shrink-0 bg-muted/20">
            <ShadcnButton
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </ShadcnButton>
            <ShadcnButton
              type="button"
              onClick={handleSelectAsset}
              disabled={selectedAssets.length === 0}
            >
              Select Image
            </ShadcnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
