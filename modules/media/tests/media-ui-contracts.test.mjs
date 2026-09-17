import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('media browser upload and move actions share the server-configured disk without public fallbacks', () => {
    const disk = read('../resources/js/hooks/useMediaDisk.ts');
    const hook = read('../resources/js/hooks/useMediaBrowser.ts');
    const uploader = read('../resources/js/components/Upload/Uploader.tsx');
    const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');
    const editorUpload = read('../../shared/resources/js/lib/media-image-upload.ts');
    assert.match(disk, /container \|\| mediaLibrary.defaultDisk/);
    assert.match(hook, /useMediaDisk\(initialContainer\)/);
    assert.match(hook, /id: disk/);
    assert.match(hook, /\{ \[disk\]: defaultContainer \}/);
    assert.match(hook, /disk: params.container/);
    assert.match(uploader, /useMediaDisk\(container\)/);
    assert.match(uploader, /formData.append\('disk', disk\)/);
    assert.match(uploader, /\[disk, path, updateUploads\]/);
    assert.match(browser, /disk: container.id/);
    assert.match(editorUpload, /route\('media.create'\)/);
    for (const source of [hook, uploader, browser, editorUpload]) {
        assert.doesNotMatch(source, /['"]public['"]/);
    }
});

test('gallery fields use direct imports without cycling through their own re-export indexes', () => {
    const field = read('../resources/js/components/Field/SimpleAssetsField.tsx');
    const gallery = read('../../photography/resources/js/pages/createOrEdit.tsx');
    assert.match(field, /from '\.\.\/Browser\/AssetBrowser'/);
    assert.match(field, /from '\.\.\/Editor\/AssetEditor'/);
    assert.doesNotMatch(field, /from '@media\/components(?:\/Field)?'/);
    assert.match(gallery, /from '@media\/components\/Field\/SimpleAssetsField'/);
});

test('uploads capture their destination, use a bounded queue and current completion callbacks', () => {
    const uploader = read('../resources/js/components/Upload/Uploader.tsx');
    const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');
    const hook = read('../resources/js/hooks/useMediaBrowser.ts');
    const row = read('../resources/js/components/Upload/Upload.tsx');
    assert.match(uploader, /createUploadQueue\(2\)/);
    assert.ok(uploader.indexOf('const destination = normalizeUploadPath(path)') < uploader.indexOf('queue.current.add'));
    assert.match(uploader, /formData.append\('path', destination\)/);
    assert.match(uploader, /\[upload\]/);
    assert.match(uploader, /callbacks.current.onUploadComplete/);
    assert.match(uploader, /timeout: 120_000/);
    assert.match(uploader, /confirmedUpload\(response.data, destination\)/);
    assert.match(browser, /onUploadComplete=\{refreshAfterUpload\}/);
    assert.match(browser, /asset-browser media-workspace[^]*?onDragOver=\{handleDragOver\}[^]*?onDrop=\{handleDrop\}/);
    assert.match(hook, /normalizeUploadPath\(asset.directory\) !== normalizeUploadPath\(path\)/);
    assert.match(hook, /setSelectedPage\(1\)/);
    assert.match(hook, /setSort\('created_at'\)/);
    assert.match(row, /Uploading to:/);
    assert.match(row, /upload.destination \|\| 'All files'/);
});

test('mixed deletion checks usage, submits only unused files and keeps protected selections', () => {
    const dialog = read('../resources/js/components/Browser/AssetDeleter.tsx');
    const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');
    assert.match(dialog, /route\('media.usage'\)/);
    assert.match(dialog, /route\('media.delete-unused'\)/);
    assert.match(dialog, /media_ids: unused.map\(\(asset\) => asset.id\)/);
    assert.match(dialog, /onDeleted\(data.deleted_ids\)/);
    assert.match(dialog, /disabled=\{!ready \|\| isDeleting \|\| !unused.length\}/);
    assert.match(dialog, /In use · kept/);
    assert.match(dialog, /Delete unused files/);
    assert.match(dialog, /Recheck usage/);
    assert.match(dialog, /setDeleteError\(data.errors.map/);
    assert.match(dialog, /href=\{reference.url\}/);
    assert.match(browser, /browserSelectedAssets.filter\(\(id\) => !deletedAssetIds.includes\(id\)\)/);
    assert.match(browser, /deletedAssetIds.forEach\(deselectAsset\)/);
});

test('media moves support both accessible dialogs and internal drag targets without changing upload drops', () => {
    const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');
    const mover = read('../resources/js/components/Browser/AssetMover.tsx');
    assert.match(browser, /indexPage && canEdit/);
    assert.match(browser, /browserSelectedAssets.includes\(id\) \? \[\.\.\.browserSelectedAssets\] : \[id\]/);
    assert.match(browser, /dataTransfer.types.includes\(MEDIA_DRAG_TYPE\)/);
    assert.match(browser, /dataTransfer.types.includes\('Files'\)/);
    assert.match(browser, /Move to folder/);
    assert.match(browser, /onNavigated\?\.\(container.id, destination, completed\)/);
    assert.match(browser, /onSelectionsUpdated\?\.\(completed\)/);
    assert.match(mover, /route\('media.folders'\)/);
    assert.match(mover, /<DialogTitle>/);
    assert.match(mover, /Move here/);
    for (const file of ['Listing/AssetRow', 'Listing/AssetTile']) {
        const source = read(`../resources/js/components/Browser/${file}.tsx`);
        assert.match(source, /onDragStart=/);
        assert.match(source, /Move to folder/);
    }
    for (const file of ['Listing/FolderRow', 'Listing/FolderTile', 'Listing/TableListing', 'Listing/GridListing', 'Navigation/Breadcrumbs']) {
        assert.match(read(`../resources/js/components/Browser/${file}.tsx`), /folderProps\(/);
    }
});

test('upload feedback is integrated with the browser instead of nested in a card', () => {
    const listing = read('../resources/js/components/Upload/Uploads.tsx');
    const row = read('../resources/js/components/Upload/Upload.tsx');
    assert.match(listing, /asset-upload-listing border-border text-foreground border-b/);
    assert.doesNotMatch(listing, /rounded-lg|bg-card|sm:m-5|m-4|bg-muted\/30/);
    assert.match(listing, /uploads.length === 1 && 'sr-only'/);
    assert.match(listing, /Dismiss all/);
    assert.match(row, /role="progressbar"/);
    assert.match(row, /role=\{failed \? 'alert'/);
    assert.match(row, /Dismiss \$\{upload.name\} upload status/);
    assert.doesNotMatch(row, /bg-destructive\/10|bg-primary\/10/);
});

test('folder editor uses a clear label and example without duplicated helper copy', () => {
    const editor = read('../resources/js/components/Browser/Navigation/FolderEditor.tsx');
    assert.match(editor, /<Label htmlFor="basename">Folder name<\/Label>/);
    assert.match(editor, /placeholder="e.g. blog-images"/);
    assert.doesNotMatch(editor, /The filesystem directory name/);
    assert.match(editor, /savingRef.current \|\| !basename/);
    assert.match(editor, /e.preventDefault\(\)/);
    assert.match(editor, /e.stopPropagation\(\)/);
    assert.match(editor, /toast.success\(/);
    assert.match(editor, /error.response.data\?\.message/);
    assert.match(editor, /path: data.path/);
    assert.doesNotMatch(editor, /CustomEvent\('toast'/);
});

test('picker and manager load the same styles and keep selection out of the search toolbar', () => {
    const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');
    assert.match(browser, /import '\.\.\/\.\.\/\.\.\/css\/media-workspace\.css'/);
    assert.match(browser, /asset-browser media-workspace/);
    assert.match(browser, /indexPage && browserSelectedAssets.length > 0/);
    assert.doesNotMatch(browser, /indexPage \|\| !browserSelectedAssets.length/);
    const picker = read('../resources/js/components/UI/AssetPickerDialog.tsx');
    assert.match(picker, /DialogHeader className="border-border shrink-0 border-b/);
    assert.match(picker, /onClick=\{onClear\}/);
});

test('parent navigation and checkboxes use the same centered control size', () => {
    const row = read('../resources/js/components/Browser/Listing/AssetRow.tsx');
    const listing = read('../resources/js/components/Browser/Listing/TableListing.tsx');
    const css = read('../resources/css/media-workspace.css');
    assert.match(row, /media-selection-control flex size-8 items-center justify-center/);
    assert.match(listing, /className="media-selection-control"/);
    assert.match(css, /\.media-selection-control\s*\{\s*width: var\(--control-height/);
    assert.match(css, /border-start-end-radius: 0/);
    assert.match(css, /border-start-start-radius: 0/);
});

test('empty fields do not draw a second bottom divider', () => {
    const simple = read('../resources/js/components/Field/SimpleAssetsField.tsx');
    const field = read('../resources/js/components/Field/AssetsField.tsx');
    assert.equal((simple.match(/!isEmpty && 'border-b'/g) || []).length, 2);
    assert.match(field, /assets.length > 0 && 'border-b'/);
});

test('file-drop feedback overlays existing field bounds without adding layout height', () => {
    const overlay = read('../resources/js/components/Field/AssetDropOverlay.tsx');
    assert.match(overlay, /pointer-events-none absolute inset-0/);
    assert.match(overlay, /rounded-\[inherit\] border border-dashed/);
    assert.match(overlay, /bg-background\/90/);
    assert.match(overlay, /role="status"/);
    assert.doesNotMatch(overlay, /min-h-|h-screen|fixed/);

    for (const name of ['SimpleAssetsField', 'AssetsField']) {
        const field = read(`../resources/js/components/Field/${name}.tsx`);
        const expectedBranches = name === 'SimpleAssetsField' ? 2 : 1;
        assert.equal((field.match(/<AssetDropOverlay \/>/g) || []).length, expectedBranches);
        assert.equal((field.match(/assets-fieldtype relative isolate/g) || []).length, expectedBranches);
        assert.doesNotMatch(field, /drag-notification/);
        assert.match(field, /dataTransfer.types.includes\('Files'\)/);
        assert.match(field, /e.currentTarget.contains\(e.relatedTarget\)/);
    }
});

test('folder and asset previews share one square sizing rule', () => {
    const css = read('../resources/css/media-workspace.css');
    assert.match(css, /:is\(\.folder-thumb-container, \.asset-thumb-container\)\s*\{\s*aspect-ratio: 1;/);
    assert.doesNotMatch(css, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.match(css, /:is\(\.folder-meta, \.asset-meta\)\s*\{\s*padding: 0\.75rem;/);
});

test('failed thumbnail URLs have a fallback rather than visible broken-image alt text', () => {
    const tile = read('../resources/js/components/Browser/Listing/AssetTile.tsx');
    const preview = read('../resources/js/components/UI/AssetImagePreview.tsx');
    assert.match(tile, /<AssetImagePreview/);
    assert.match(preview, /onError=\{\(\) => setStatus\('error'\)\}/);
    assert.match(preview, /Preview unavailable/);
    assert.match(preview, /src && status !== 'error'/);
    assert.match(tile, /aria-label=\{`Open \$\{asset.title \|\| asset.filename\}`\}/);
});

test('image previews reserve space and handle loading, cached images and source changes consistently', () => {
    const preview = read('../resources/js/components/UI/AssetImagePreview.tsx');
    assert.match(preview, /key=\{props.src\}/);
    assert.match(preview, /image\?\.complete/);
    assert.match(preview, /image.naturalWidth > 0/);
    assert.match(preview, /aria-busy=\{status === 'loading'\}/);
    assert.match(preview, /motion-safe:animate-pulse/);
    assert.match(preview, /status === 'ready' \? 'opacity-100' : 'opacity-0'/);
    assert.match(preview, /absolute inset-0 h-full w-full/);
    for (const file of [
        'Field/AssetFieldTile',
        'Field/AssetFieldRow',
        'Browser/Listing/AssetTile',
        'Browser/Listing/AssetRow',
        'Editor/AssetEditor',
    ]) {
        const source = read(`../resources/js/components/${file}.tsx`);
        assert.match(source, /<AssetImagePreview/);
        assert.doesNotMatch(source, /<img\b/);
    }
    for (const file of ['SimpleAssetsField', 'AssetsField']) {
        assert.match(read(`../resources/js/components/Field/${file}.tsx`), /loading && <AssetFieldLoading/);
    }
});

test('asset editor directs opening focus to its labelled dialog instead of a tooltip trigger', () => {
    const editor = read('../resources/js/components/Editor/AssetEditor.tsx');
    assert.match(editor, /ref=\{dialogRef\}/);
    assert.match(editor, /tabIndex=\{-1\}/);
    assert.match(
        editor,
        /onOpenAutoFocus=\{\(event\) => \{[\s\S]*?event.preventDefault\(\);[\s\S]*?dialogRef.current\?\.focus\(\{ preventScroll: true \}\);/,
    );
    assert.match(editor, /<DialogTitle/);
    assert.match(editor, /tooltip="Close"/);
});
