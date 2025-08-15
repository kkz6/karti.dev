import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import axios from 'axios';
import React, { useState } from 'react';
import { MediaAsset } from '../../types/media';

interface AssetDeleterProps {
    assets: MediaAsset[];
    isOpen: boolean;
    onDeleted: (deletedAssetIds: string[]) => void;
    onClosed: () => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getFileTypeColor = (aggregateType: string): string => {
    switch (aggregateType) {
        case 'image':
            return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
        case 'video':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
        case 'audio':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
        case 'document':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
};

export const AssetDeleter: React.FC<AssetDeleterProps> = ({ assets, isOpen, onDeleted, onClosed }) => {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[] | null>(null);

    const isMultiple = assets.length > 1;
    const totalSize = assets.reduce((total, asset) => total + asset.size, 0);

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrors(null);

        try {
            // Delete assets individually using the existing route
            const deletePromises = assets.map((asset) => axios.delete(`/admin/media/${asset.id}`));

            await Promise.all(deletePromises);

            // Call success callback with deleted asset IDs
            onDeleted(assets.map((asset) => asset.id));
            onClosed();
        } catch (error: any) {
            setIsDeleting(false);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete assets';
            setErrors([errorMessage]);
        }
    };

    const handleCancel = () => {
        onClosed();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClosed}>
            <DialogContent className="border-gray-200 bg-white sm:max-w-2xl dark:border-gray-700 dark:bg-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">Delete {isMultiple ? `${assets.length} items` : 'item'}?</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert className="border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/30">
                        <AlertDescription className="text-orange-900 dark:text-orange-100">
                            <span className="font-medium text-orange-900 dark:text-orange-100">
                                {isMultiple
                                    ? `This action will permanently delete ${assets.length} files. This cannot be undone.`
                                    : 'This action will permanently delete this file. This cannot be undone.'}
                            </span>
                        </AlertDescription>
                    </Alert>

                    {errors && (
                        <Alert variant="destructive" className="border-red-400 bg-red-50 shadow-sm dark:border-red-600 dark:bg-red-900/30">
                            <AlertDescription className="text-red-900 dark:text-red-100">
                                {errors.map((error, i) => (
                                    <p key={i} className="text-sm leading-relaxed font-medium text-red-900 dark:text-red-100">
                                        {error}
                                    </p>
                                ))}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 px-4 py-3 dark:bg-gray-800/50">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Files to be deleted</h3>
                            {isMultiple && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total size: {formatFileSize(totalSize)}</p>}
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {assets.map((asset) => (
                                <div key={asset.id} className="border-b border-gray-200 px-4 py-3 last:border-b-0 dark:border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            {asset.thumbnail_url ? (
                                                <img src={asset.thumbnail_url} alt={asset.filename} className="h-10 w-10 rounded object-cover" />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {asset.extension.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {asset.title || asset.filename}
                                                </p>
                                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{asset.filename}</p>
                                                <div className="mt-1 flex items-center space-x-2">
                                                    <Badge className={getFileTypeColor(asset.aggregate_type)}>{asset.aggregate_type}</Badge>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(asset.size)}</span>
                                                    {asset.dimensions && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {asset.dimensions.width} × {asset.dimensions.height}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Created: {formatDate(asset.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={isDeleting} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto">
                        {isDeleting ? 'Deleting...' : `Delete ${isMultiple ? `${assets.length} items` : 'item'}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
