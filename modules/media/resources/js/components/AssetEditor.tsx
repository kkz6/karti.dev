import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import axios from 'axios';
import { Download, ExternalLink, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { MediaAsset } from '../types/media';
import { ActionButton } from './ActionButton';
import { FileIcon } from './FileIcon';
import { LoadingGraphic } from './LoadingGraphic';

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
    alt?: string;
    focus?: string;
}

export const AssetEditor: React.FC<AssetEditorProps> = ({ assetId, isOpen, onClose, onSaved, onDeleted, allowDeleting = false }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [asset, setAsset] = useState<AssetEditorData | null>(null);
    const [title, setTitle] = useState('');
    const [altText, setAltText] = useState('');
    const [focus, setFocus] = useState<string | null>(null);
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
                title,
                altText,
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

    const handleDelete = async () => {
        if (!asset || !assetId) return;

        if (!confirm('Are you sure you want to delete this asset?')) {
            return;
        }

        try {
            await axios.delete(route('media.destroy', assetId));

            if (onDeleted) {
                onDeleted(assetId);
            }

            // Show success message
            const event = new CustomEvent('toast', {
                detail: { type: 'success', message: 'Asset deleted successfully' },
            });
            window.dispatchEvent(event);

            onClose();
        } catch (error) {
            console.error('Error deleting asset:', error);

            // Show error toast
            const event = new CustomEvent('toast', {
                detail: { type: 'error', message: 'Error deleting asset' },
            });
            window.dispatchEvent(event);
        }
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
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
                        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2">
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
                                {allowDeleting && <ActionButton action={handleDelete} icon={X} tooltip="Delete" variant="destructive" />}
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

                            {isImage && (
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
        </Dialog>
    );
};
