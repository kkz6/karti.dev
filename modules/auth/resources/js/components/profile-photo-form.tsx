import { useForm, usePage } from '@inertiajs/react';
import InputError from '@shared/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { useInitials } from '@shared/hooks/use-initials';
import { type SharedData } from '@shared/types';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ProfilePhotoForm({ hasPhoto, onDirtyChange }: { hasPhoto: boolean; onDirtyChange: (dirty: boolean) => void }) {
    const { auth } = usePage<SharedData>().props;
    const initials = useInitials();
    const input = useRef<HTMLInputElement>(null);
    const form = useForm<{ photo: File | null }>({ photo: null });
    const removal = useForm({});
    const [preview, setPreview] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const busy = form.processing || removal.processing;
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );
    function clearSelection() {
        form.reset();
        form.clearErrors();
        setPreview(null);
        onDirtyChange(false);
        if (input.current) input.current.value = '';
    }
    return (
        <Card>
            <CardContent className="space-y-4 p-5">
                <div>
                    <h2 className="font-semibold">Profile image</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Shown in your account menu and profile.</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar className="size-20 shrink-0 rounded-full border">
                        <AvatarImage
                            src={preview ?? auth.user.avatar ?? undefined}
                            alt={preview ? 'New profile image preview' : auth.user.name}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-xl">{initials(auth.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-3">
                        <input
                            ref={input}
                            id="profile-photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            tabIndex={-1}
                            aria-label="Choose profile image"
                            disabled={busy}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                form.clearErrors();
                                setMessage('');
                                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                                    form.setError('photo', 'Choose a JPG, PNG or WebP image up to 2 MB.');
                                    event.target.value = '';
                                    return;
                                }
                                form.setData('photo', file);
                                setPreview(URL.createObjectURL(file));
                                onDirtyChange(true);
                            }}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
                                <Camera className="size-4" />
                                {hasPhoto ? 'Change image' : 'Upload image'}
                            </Button>
                            {form.data.photo ? (
                                <>
                                    <Button
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            form.post(route('profile.photo.update'), {
                                                forceFormData: true,
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    clearSelection();
                                                    setMessage('Profile image updated.');
                                                },
                                            })
                                        }
                                    >
                                        {form.processing && <LoaderCircle className="size-4 animate-spin" />}Save image
                                    </Button>
                                    <Button type="button" variant="ghost" disabled={busy} onClick={clearSelection}>
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                hasPhoto && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={busy}
                                        onClick={() =>
                                            removal.delete(route('profile.photo.destroy'), {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    clearSelection();
                                                    setMessage('Profile image removed.');
                                                },
                                            })
                                        }
                                    >
                                        {removal.processing ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Remove
                                    </Button>
                                )
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs">JPG, PNG or WebP · up to 2 MB. A square image works best.</p>
                    </div>
                </div>
                <InputError message={form.errors.photo} />
                {message && (
                    <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
                        {message}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
