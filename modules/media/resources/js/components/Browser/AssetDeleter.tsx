import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import axios from 'axios';
import { ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MediaAsset } from '../../types/media';
import { AssetImagePreview } from '../UI/AssetImagePreview';

interface Usage {
    type: string;
    title: string;
    field: string;
    url: string | null;
}
interface UsageResult {
    id: string;
    title: string;
    usages: Usage[];
}
interface AssetDeleterProps {
    assets: MediaAsset[];
    isOpen: boolean;
    onDeleted: (deletedAssetIds: string[]) => void;
    onClosed: () => void;
}

export function AssetDeleter({ assets, isOpen, onDeleted, onClosed }: AssetDeleterProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState<Record<string, UsageResult>>({});
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [revision, setRevision] = useState(0);
    const [snapshotKey, setSnapshotKey] = useState('');
    const selectionKey = assets
        .map((asset) => asset.id)
        .sort()
        .join(',');
    const remaining = assets.filter((asset) => !deletedIds.includes(asset.id));
    const remainingKey = remaining
        .map((asset) => asset.id)
        .sort()
        .join(',');
    const ready = !loading && !loadFailed && snapshotKey === remainingKey;
    const unused = remaining.filter((asset) => usage[asset.id]?.usages.length === 0);
    const usedCount = remaining.filter((asset) => (usage[asset.id]?.usages.length ?? 0) > 0).length;

    useEffect(() => {
        setDeletedIds([]);
        setDeleteError(null);
    }, [selectionKey, isOpen]);

    useEffect(() => {
        if (!isOpen || !remainingKey) return;
        const controller = new AbortController();
        setLoading(true);
        setLoadFailed(false);
        setError(null);
        axios
            .get<{ assets: UsageResult[] }>(route('media.usage'), {
                params: { media_ids: remainingKey.split(',') },
                signal: controller.signal,
            })
            .then(({ data }) => {
                if (controller.signal.aborted) return;
                setUsage(Object.fromEntries(data.assets.map((asset) => [asset.id, asset])));
                setSnapshotKey(remainingKey);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setLoadFailed(true);
                setError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message || 'Could not check where these files are used.'
                        : 'Could not check file usage.',
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [isOpen, remainingKey, revision]);

    const handleDelete = async () => {
        if (!ready || isDeleting || !unused.length) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { data } = await axios.post<{ deleted_ids: string[]; kept: UsageResult[]; errors: { id: string; message: string }[] }>(
                route('media.delete-unused'),
                {
                    media_ids: unused.map((asset) => asset.id),
                },
            );
            setUsage((current) => ({ ...current, ...Object.fromEntries(data.kept.map((asset) => [asset.id, asset])) }));
            if (data.deleted_ids.length) {
                setDeletedIds((current) => [...current, ...data.deleted_ids]);
                onDeleted(data.deleted_ids);
            }
            if (data.errors.length) setDeleteError(data.errors.map((item) => item.message).join(' '));
            if (data.deleted_ids.length === remaining.length) onClosed();
        } catch (err) {
            setDeleteError(
                axios.isAxiosError(err) ? err.response?.data?.message || 'Could not delete files. Please retry.' : 'Could not delete files.',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !isDeleting) onClosed();
            }}
        >
            <DialogContent
                className="flex max-h-[90dvh] flex-col sm:max-w-2xl"
                onEscapeKeyDown={(event) => {
                    if (isDeleting) event.preventDefault();
                }}
                onPointerDownOutside={(event) => {
                    if (isDeleting) event.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Delete {remaining.length === 1 ? 'file' : 'files'}?</DialogTitle>
                    <DialogDescription>
                        Only unused files can be deleted. This permanently removes their originals and generated previews.
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 space-y-4 overflow-y-auto">
                    {loading && (
                        <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
                            <LoaderCircle className="size-4 animate-spin" />
                            Checking where these files are used…
                        </p>
                    )}
                    {ready && usedCount > 0 && (
                        <div className="bg-muted/50 flex gap-3 rounded-md p-3 text-sm" role="status">
                            <ShieldCheck className="text-primary size-5 shrink-0" aria-hidden="true" />
                            <div>
                                <p className="font-medium">
                                    {usedCount} {usedCount === 1 ? 'file is' : 'files are'} in use and will be kept.
                                </p>
                                <p className="text-muted-foreground mt-1">
                                    Open the references below to replace or remove them.
                                    {unused.length > 0 && ' You can delete the unused files now.'}
                                </p>
                            </div>
                        </div>
                    )}
                    {deletedIds.length > 0 && (
                        <p role="status" className="text-muted-foreground text-sm">
                            Deleted {deletedIds.length} unused {deletedIds.length === 1 ? 'file' : 'files'}. Remaining files are still selected.
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="text-destructive text-sm">
                            {error}
                        </p>
                    )}
                    {deleteError && (
                        <p role="alert" className="text-destructive text-sm">
                            {deleteError}
                        </p>
                    )}
                    <ul className="border-border max-h-[50vh] divide-y overflow-y-auto rounded-md border">
                        {remaining.map((asset) => {
                            const references = usage[asset.id]?.usages ?? [];
                            return (
                                <li key={asset.id} className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 shrink-0 overflow-hidden rounded">
                                            <AssetImagePreview src={asset.thumbnail_url} alt={asset.title || asset.filename} compact />
                                        </div>
                                        <p className="min-w-0 flex-1 truncate text-sm font-medium">{asset.title || asset.filename}</p>
                                        {ready && (
                                            <span className="text-muted-foreground shrink-0 text-xs">
                                                {references.length ? 'In use · kept' : 'Unused'}
                                            </span>
                                        )}
                                    </div>
                                    {!!references.length && (
                                        <ul className="mt-2 space-y-2 pl-[3.25rem]">
                                            {references.map((reference, index) => (
                                                <li key={index} className="text-sm">
                                                    {reference.url ? (
                                                        <a
                                                            className="text-foreground hover:text-primary inline-flex items-center gap-1.5 underline underline-offset-4"
                                                            href={reference.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {reference.title}
                                                            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                                                            <span className="sr-only">(opens in a new tab)</span>
                                                        </a>
                                                    ) : (
                                                        <span>{reference.title}</span>
                                                    )}
                                                    <p className="text-muted-foreground text-xs">
                                                        {reference.type} · {reference.field}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <p className="text-muted-foreground text-xs">
                        Checks saved content and settings, including trash. External websites and unsaved drafts cannot be checked.
                    </p>
                </div>
                <DialogFooter className="flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setRevision((current) => current + 1)} disabled={loading || isDeleting}>
                        <RefreshCw />
                        Recheck usage
                    </Button>
                    <Button variant="outline" onClick={onClosed} disabled={isDeleting}>
                        {deletedIds.length || (ready && !unused.length) ? 'Done' : 'Cancel'}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!ready || isDeleting || !unused.length}>
                        {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                        {isDeleting ? 'Deleting…' : `Delete unused files (${ready ? unused.length : '…'})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
