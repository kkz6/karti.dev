import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import axios from 'axios';
import { ArrowUp, ChevronRight, Folder, FolderInput, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeFolder } from './MediaMoveContext';

interface AssetMoverProps {
    assets: string[];
    container: string;
    folder: string;
    onMove: (destination: string) => Promise<void>;
    onClosed: () => void;
}

export function AssetMover({ assets, container, folder, onMove, onClosed }: AssetMoverProps) {
    const [path, setPath] = useState(normalizeFolder(folder));
    const [folders, setFolders] = useState<{ path: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        axios
            .get(route('media.folders'), { params: { disk: container, path }, signal: controller.signal })
            .then(({ data }) => {
                setFolders(data.folders);
                setLoading(false);
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setFolders([]);
                setError(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not load folders.' : 'Could not load folders.');
                setLoading(false);
            });
        return () => controller.abort();
    }, [container, path, reload]);
    const move = async () => {
        setSaving(true);
        setError('');
        try {
            await onMove(path);
            onClosed();
        } catch (error) {
            setError(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not move files.' : 'Could not move files.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !saving) onClosed();
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Move {assets.length === 1 ? 'file' : `${assets.length} files`}</DialogTitle>
                    <DialogDescription>
                        Choose a destination. Selected images stay selected, and saved image links are updated automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Parent folder"
                            disabled={path === '/' || saving || loading}
                            onClick={() => setPath(path.split('/').slice(0, -1).join('/') || '/')}
                        >
                            <ArrowUp />
                        </Button>
                        <p className="min-w-0 text-sm break-all">
                            <span className="text-muted-foreground">Destination: </span>
                            {path === '/' ? 'All files' : path}
                        </p>
                    </div>
                    <div className="border-border/60 max-h-64 min-h-32 overflow-y-auto rounded-md border" aria-busy={loading}>
                        {loading ? (
                            <p role="status" className="text-muted-foreground p-4 text-sm">
                                Loading folders…
                            </p>
                        ) : folders.length ? (
                            folders.map((item) => (
                                <button
                                    key={item.path}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setPath(item.path)}
                                    className="hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-3 px-4 py-3 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <Folder className="text-muted-foreground size-4 shrink-0" />
                                    <span className="min-w-0 flex-1 break-words">{item.title}</span>
                                    <ChevronRight className="size-4 shrink-0" />
                                </button>
                            ))
                        ) : (
                            <p className="text-muted-foreground p-4 text-sm">
                                {error ? 'Folders could not be loaded.' : 'No subfolders. You can move files here.'}
                            </p>
                        )}
                    </div>
                    {error && (
                        <div role="alert" className="text-destructive text-sm">
                            {error}
                            <Button variant="link" onClick={() => setReload((value) => value + 1)} disabled={saving}>
                                Reload folders
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" disabled={saving} onClick={onClosed}>
                        Cancel
                    </Button>
                    <Button disabled={saving || loading || !!error || path === normalizeFolder(folder) || assets.length === 0} onClick={move}>
                        {saving ? <Loader2 className="animate-spin" /> : <FolderInput />}
                        {saving ? 'Moving…' : 'Move here'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
