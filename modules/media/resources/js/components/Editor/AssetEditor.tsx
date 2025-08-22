import type { MediaAsset } from '@media/types/media';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import axios from 'axios';
import { Download, ExternalLink, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AssetDeleter } from '../Browser/AssetDeleter';
import { FileIcon } from '../Icons';
import { ActionButton, LoadingGraphic } from '../UI';
import { FocalPointEditor } from './FocalPointEditor';
import { ImageEditor } from './ImageEditor';

interface AssetEditorProps {
    assetId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (asset: MediaAsset) => void;
    onDeleted?: (assetId: string) => void;
    allowDeleting?: boolean;
}

interface AssetEditorData extends MediaAsset {
    preview?: string;
    is_previewable?: boolean;
    width?: number;
    height?: number;
    last_modified_relative?: string;
}

export const AssetEditor: React.FC<AssetEditorProps> = ({ assetId, isOpen, onClose, onSaved, onDeleted, allowDeleting = false }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [asset, setAsset] = useState<AssetEditorData | null>(null);
    const [title, setTitle] = useState('');
    const [altText, setAltText] = useState('');
    const [credit, setCredit] = useState('');
    const [caption, setCaption] = useState('');
    const [focus, setFocus] = useState<string | null>(null);
    const [showFocalPointEditor, setShowFocalPointEditor] = useState(false);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [showAssetDeleter, setShowAssetDeleter] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const isImage = asset?.is_image || false;

    useEffect(() => {
        if (isOpen && assetId) {
            loadAsset();
        }
    }, [isOpen, assetId]);

    const loadAsset = async () => {
        if (!assetId) return;

        setLoading(true);
        try {
            const response = await axios.post(route('media.show', assetId));
            const assetData = response.data;

            // The DTO already provides all necessary computed properties
            setAsset(assetData);
            setTitle(assetData.title || assetData.filename);
            setAltText(assetData.alt || '');
            setCredit(assetData.credit || '');
            setCaption(assetData.caption || '');
            setFocus(assetData.focus || null);
            setErrors([]);
        } catch (error) {
            console.error('Error loading asset:', error);
            setErrors(['Failed to load asset']);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!asset || !assetId) return;

        setSaving(true);
        try {
            const response = await axios.patch(route('media.update', assetId), {
                disk: asset.disk,
                path: asset.directory,
                title,
                alt: altText,
                credit,
                caption,
                focus,
            });

            if (onSaved) {
                onSaved(response.data.asset);
            }

            // Show success message
            const event = new CustomEvent('toast', {
                detail: { type: 'success', message: 'Asset saved successfully' },
            });
            window.dispatchEvent(event);

            onClose();
        } catch (error: any) {
            console.error('Error saving asset:', error);
            setErrors([error.response?.data?.message || 'Error saving asset']);

            // Show error toast
            const event = new CustomEvent('toast', {
                detail: { type: 'error', message: 'Error saving asset' },
            });
            window.dispatchEvent(event);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setShowAssetDeleter(true);
    };

    const handleAssetDeleted = (deletedAssetIds: string[]) => {
        if (onDeleted && deletedAssetIds.length > 0) {
            onDeleted(deletedAssetIds[0]);
        }

        // Show success message
        const event = new CustomEvent('toast', {
            detail: { type: 'success', message: 'Asset deleted successfully' },
        });
        window.dispatchEvent(event);

        onClose();
    };

    const handleAssetDeleterClosed = () => {
        setShowAssetDeleter(false);
    };

    const handleDownload = () => {
        if (asset?.url) {
            const link = document.createElement('a');
            link.href = asset.url;
            link.download = asset.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOpen = () => {
        if (asset?.url) {
            window.open(asset.url, '_blank');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {asset && <FileIcon extension={asset.extension} className="h-5 w-5" />}
                        {asset?.filename || 'Asset Editor'}
                    </DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <LoadingGraphic />
                    </div>
                )}

                {saving && (
                    <div className="flex items-center justify-center py-8">
                        <LoadingGraphic text="Saving..." />
                    </div>
                )}

                {errors.length > 0 && (
                    <Alert className="mb-4">
                        <AlertDescription>
                            {errors.map((error, index) => (
                                <div key={index}>{error}</div>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                {!loading && !saving && asset && (
                    <div className="space-y-6">
                        {/* Asset Meta Information */}
                        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2 dark:bg-gray-800">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileIcon extension={asset.extension} className="h-4 w-4" />
                                    <span className="text-sm font-medium">{asset.path}</span>
                                </div>

                                {isImage && asset.width && asset.height && (
                                    <div className="text-sm">
                                        <span className="font-medium">Dimensions:</span> {asset.width} x {asset.height}
                                    </div>
                                )}

                                <div className="text-sm">
                                    <span className="font-medium">Size:</span> {formatFileSize(asset.size)}
                                </div>

                                <div className="text-sm">
                                    <span className="font-medium">Last Modified:</span> {formatDate(asset.updated_at)}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-start justify-end gap-2">
                                <ActionButton action={handleOpen} icon={ExternalLink} tooltip="Open in new tab" />
                                <ActionButton action={handleDownload} icon={Download} tooltip="Download" />
                                {allowDeleting && <ActionButton action={handleDeleteClick} icon={X} tooltip="Delete" variant="destructive" />}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="space-y-4">
                            {isImage && asset.preview && (
                                <div className="flex justify-center">
                                    <img
                                        src={asset.preview || asset.url}
                                        alt={asset.title}
                                        className="max-h-96 max-w-full rounded-lg border object-contain"
                                    />
                                </div>
                            )}

                            {asset.is_audio && (
                                <div className="flex justify-center">
                                    <audio src={asset.url} controls preload="auto" className="w-full max-w-md" />
                                </div>
                            )}

                            {asset.is_video && (
                                <div className="flex justify-center">
                                    <video src={asset.url} controls className="w-full max-w-2xl rounded-lg" />
                                </div>
                            )}

                            {asset.extension === 'pdf' && (
                                <div className="h-96">
                                    <object data={asset.url} type="application/pdf" width="100%" height="100%" className="rounded-lg border">
                                        <p>
                                            PDF cannot be displayed.{' '}
                                            <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                                Download PDF
                                            </a>
                                        </p>
                                    </object>
                                </div>
                            )}
                        </div>

                        {/* Edit Form */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Asset title" />
                            </div>

                            <div>
                                <Label htmlFor="credit">Credit</Label>
                                <Input
                                    id="credit"
                                    value={credit}
                                    onChange={(e) => setCredit(e.target.value)}
                                    placeholder="Photo credit or attribution"
                                />
                            </div>

                            <div>
                                <Label htmlFor="caption">Caption</Label>
                                <Textarea
                                    id="caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Caption or description"
                                    rows={3}
                                />
                            </div>

                            {isImage && (
                                <>
                                    <div>
                                        <Label htmlFor="altText">Alt Text</Label>
                                        <Textarea
                                            id="altText"
                                            value={altText}
                                            onChange={(e) => setAltText(e.target.value)}
                                            placeholder="Alternative text for accessibility"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label>Focal Point</Label>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {focus ? `${focus.replace('-', '%, ')}%` : 'Not set (default: 50%, 50%)'}
                                            </span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowFocalPointEditor(true)}>
                                                Edit Focal Point
                                            </Button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Set the focal point for image cropping</p>
                                    </div>

                                    <div>
                                        <Label>Image Editor</Label>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Edit, crop, rotate and apply filters to your image
                                            </span>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowImageEditor(true)}>
                                                Edit Image
                                            </Button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Advanced image editing with cropping, filters and effects
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {!loading && asset && (
                        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            {/* Focal Point Editor */}
            {asset && isImage && (
                <FocalPointEditor
                    isOpen={showFocalPointEditor}
                    image={asset.url}
                    initialFocus={focus || undefined}
                    onSelect={(newFocus) => {
                        setFocus(newFocus);
                        setShowFocalPointEditor(false);
                    }}
                    onClose={() => setShowFocalPointEditor(false)}
                />
            )}

            {/* Image Editor */}
            {asset && isImage && (
                <ImageEditor
                    asset={asset}
                    isOpen={showImageEditor}
                    onClose={() => setShowImageEditor(false)}
                    onSaved={(updatedAsset) => {
                        setAsset(updatedAsset);
                        setShowImageEditor(false);
                        if (onSaved) onSaved(updatedAsset);
                    }}
                />
            )}

            {/* Asset Deleter */}
            {showAssetDeleter && asset && (
                <AssetDeleter
                    assets={[asset as MediaAsset]}
                    isOpen={showAssetDeleter}
                    onDeleted={handleAssetDeleted}
                    onClosed={handleAssetDeleterClosed}
                />
            )}
        </Dialog>
    );
};
