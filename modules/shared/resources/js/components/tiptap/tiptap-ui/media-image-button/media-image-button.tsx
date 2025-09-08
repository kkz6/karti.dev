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
    return editor.can().setImage({ src: '' });
  }, [editor]);

  const handleInsertImage = (asset: MediaAsset) => {
    if (!editor || !canInsertImage) return;

    editor
      .chain()
      .focus()
      .setImage({
        src: asset.url,
        alt: asset.alt || asset.filename || '',
        title: asset.title || asset.filename || '',
      })
      .run();

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
        const assetData = await mediaService.current.getFile(assetId);
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
