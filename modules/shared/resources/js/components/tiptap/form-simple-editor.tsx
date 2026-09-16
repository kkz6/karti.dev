import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { EditorContent, EditorContext, useEditor, useEditorState } from '@tiptap/react';
import { marked } from 'marked';
import * as React from 'react';

// --- Tiptap Core Extensions ---
import { Highlight } from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Placeholder, Selection } from '@tiptap/extensions';
import { StarterKit } from '@tiptap/starter-kit';

// --- UI Primitives ---
import { Button } from '@shared/components/tiptap/tiptap-ui-primitive/button';
import { Spacer } from '@shared/components/tiptap/tiptap-ui-primitive/spacer';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@shared/components/tiptap/tiptap-ui-primitive/toolbar';

// --- Tiptap Node ---
import { ResizableImage } from '@shared/components/tiptap/extensions/resizable-image/resizable-image-extension';
import '@shared/components/tiptap/extensions/resizable-image/resizable-image.scss';
import '@shared/components/tiptap/form-simple-editor.scss';
import '@shared/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss';
import { CodeBlock } from '@shared/components/tiptap/tiptap-node/code-block-node';
import '@shared/components/tiptap/tiptap-node/code-block-node/code-block-node.scss';
import '@shared/components/tiptap/tiptap-node/heading-node/heading-node.scss';
import { HorizontalRule } from '@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import '@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@shared/components/tiptap/tiptap-node/image-node/image-node.scss';
import '@shared/components/tiptap/tiptap-node/list-node/list-node.scss';
import '@shared/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss';
import '@shared/components/tiptap/tiptap-ui-primitive/button/button-colors.scss';
import '@shared/components/tiptap/tiptap-ui-primitive/button/button.scss';
import '@shared/components/tiptap/tiptap-ui-primitive/toolbar/toolbar.scss';

// --- Tiptap UI ---
import { BlockquoteButton } from '@shared/components/tiptap/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@shared/components/tiptap/tiptap-ui/code-block-button';
import {
    ColorHighlightPopover,
    ColorHighlightPopoverButton,
    ColorHighlightPopoverContent,
} from '@shared/components/tiptap/tiptap-ui/color-highlight-popover';
import { HeadingDropdownMenu } from '@shared/components/tiptap/tiptap-ui/heading-dropdown-menu';
import { LinkButton, LinkContent, LinkPopover } from '@shared/components/tiptap/tiptap-ui/link-popover';
import { ListDropdownMenu } from '@shared/components/tiptap/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@shared/components/tiptap/tiptap-ui/mark-button';
import { MediaImageButton } from '@shared/components/tiptap/tiptap-ui/media-image-button';
import { TextAlignButton } from '@shared/components/tiptap/tiptap-ui/text-align-button';
import { UndoRedoButton } from '@shared/components/tiptap/tiptap-ui/undo-redo-button';

// --- Icons ---
import { ArrowLeftIcon } from '@shared/components/tiptap/tiptap-icons/arrow-left-icon';
import { HighlighterIcon } from '@shared/components/tiptap/tiptap-icons/highlighter-icon';
import { LinkIcon } from '@shared/components/tiptap/tiptap-icons/link-icon';

// --- Hooks ---
import { useIsMobile } from '@shared/hooks/use-mobile';
import { useTiptapEditor } from '@shared/hooks/use-tiptap-editor';
import { getEditorReadingStats } from '@shared/lib/editor-reading-stats';

// --- Components ---

// --- Lib ---

// Configure marked for safe HTML output
marked.setOptions({
    gfm: true,
    breaks: true,
});

// Detect if text looks like markdown
function looksLikeMarkdown(text: string): boolean {
    const markdownPatterns = [
        /^#{1,6}\s+.+$/m, // Headers
        /\*\*[^*]+\*\*/, // Bold
        /\*[^*]+\*/, // Italic
        /~~[^~]+~~/, // Strikethrough
        /`[^`]+`/, // Inline code
        /```[\s\S]*?```/, // Code blocks
        /^\s*[-*+]\s+.+$/m, // Unordered lists
        /^\s*\d+\.\s+.+$/m, // Ordered lists
        /^\s*>\s+.+$/m, // Blockquotes
        /\[.+?\]\(.+?\)/, // Links
        /!\[.*?\]\(.+?\)/, // Images
        /^\s*---\s*$/m, // Horizontal rule
        /^\s*\*\*\*\s*$/m, // Horizontal rule alt
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
}

const MainToolbarContent = ({
    onHighlighterClick,
    onLinkClick,
    isMobile,
}: {
    onHighlighterClick: () => void;
    onLinkClick: () => void;
    isMobile: boolean;
}) => {
    const { editor } = useTiptapEditor();

    return (
        <>
            <ToolbarGroup>
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal />
                <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} portal />
                <BlockquoteButton />
                <CodeBlockButton />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <MarkButton type="bold" />
                <MarkButton type="italic" />
                <MarkButton type="strike" />
                <MarkButton type="code" />
                <MarkButton type="underline" />
                {!isMobile ? (
                    <ColorHighlightPopover />
                ) : (
                    <ColorHighlightPopoverButton onClick={onHighlighterClick} aria-pressed={editor?.isActive('highlight') ?? false} />
                )}
                {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} aria-pressed={editor?.isActive('link') ?? false} />}
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <MarkButton type="superscript" />
                <MarkButton type="subscript" />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <TextAlignButton align="left" />
                <TextAlignButton align="center" />
                <TextAlignButton align="right" />
                <TextAlignButton align="justify" />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup>
                <MediaImageButton />
            </ToolbarGroup>

            <Spacer />
        </>
    );
};

const MobileToolbarContent = ({ type, onBack }: { type: 'highlighter' | 'link'; onBack: () => void }) => (
    <>
        <ToolbarGroup>
            <Button type="button" data-style="ghost" onClick={onBack} aria-label="Back to formatting" tooltip="Back to formatting">
                <ArrowLeftIcon className="tiptap-button-icon" />
                {type === 'highlighter' ? <HighlighterIcon className="tiptap-button-icon" /> : <LinkIcon className="tiptap-button-icon" />}
            </Button>
        </ToolbarGroup>

        <ToolbarSeparator />

        {type === 'highlighter' ? <ColorHighlightPopoverContent /> : <LinkContent />}
    </>
);

interface FormSimpleEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
}

export function FormSimpleEditor({ content: initialContent = '', onChange, placeholder }: FormSimpleEditorProps) {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = React.useState<'main' | 'highlighter' | 'link'>('main');
    const editorContainerRef = React.useRef<HTMLDivElement>(null);
    const toolbarRef = React.useRef<HTMLDivElement>(null);
    const [toolbarStuck, setToolbarStuck] = React.useState(false);

    React.useEffect(() => {
        let frame: number | null = null;
        const updateStickyState = () => {
            frame = null;
            const container = editorContainerRef.current;
            const toolbar = toolbarRef.current;
            if (!container || !toolbar) return;

            const naturalTop = container.getBoundingClientRect().top + container.clientTop;
            setToolbarStuck(toolbar.getBoundingClientRect().top > naturalTop + 0.5);
        };
        const scheduleUpdate = () => {
            if (frame === null) frame = requestAnimationFrame(updateStickyState);
        };

        // Capture nested admin scroll areas as well as document scrolling.
        document.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
        window.addEventListener('resize', scheduleUpdate);
        const observer = new ResizeObserver(scheduleUpdate);
        if (editorContainerRef.current) observer.observe(editorContainerRef.current);
        updateStickyState();

        return () => {
            document.removeEventListener('scroll', scheduleUpdate, true);
            window.removeEventListener('resize', scheduleUpdate);
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, []);

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        editorProps: {
            attributes: {
                autocomplete: 'off',
                autocorrect: 'off',
                autocapitalize: 'off',
                'aria-label': placeholder || 'Main content area, start typing to enter text.',
                class: 'simple-editor',
            },
            handlePaste: (view, event) => {
                const clipboardData = event.clipboardData;
                if (!clipboardData) return false;

                const text = clipboardData.getData('text/plain');
                const html = clipboardData.getData('text/html');

                // If there's already HTML content, let TipTap handle it normally
                if (html && html.trim()) return false;

                // Check if the plain text looks like markdown
                if (text && looksLikeMarkdown(text)) {
                    event.preventDefault();

                    const htmlContent = marked.parse(text, { async: false }) as string;

                    // Parse HTML into a ProseMirror slice
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;

                    const parser = ProseMirrorDOMParser.fromSchema(view.state.schema);
                    const parsedSlice = parser.parseSlice(tempDiv);

                    const { tr } = view.state;
                    view.dispatch(tr.replaceSelection(parsedSlice));

                    return true;
                }

                return false;
            },
        },
        extensions: [
            StarterKit.configure({
                horizontalRule: false,
                codeBlock: false, // Disable default code block to use enhanced version
                link: {
                    openOnClick: false,
                    enableClickSelection: true,
                },
            }),
            HorizontalRule,
            CodeBlock.configure({
                languageClassPrefix: 'language-',
                defaultLanguage: null,
                HTMLAttributes: {
                    class: 'code-block',
                },
                syntaxHighlighting: true,
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: true }),
            ResizableImage.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'tiptap-resizable-image rounded-lg',
                },
            }),
            Typography,
            Superscript,
            Subscript,
            Selection,
            Placeholder.configure({ placeholder: placeholder || 'Start writing…' }),
        ],
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    const readingStats =
        useEditorState({
            editor,
            selector: ({ editor }) => getEditorReadingStats(editor?.getText() ?? ''),
        }) ?? getEditorReadingStats('');

    React.useEffect(() => {
        if (!isMobile && mobileView !== 'main') {
            setMobileView('main');
        }
    }, [isMobile, mobileView]);

    React.useEffect(() => {
        if (editor && initialContent !== undefined && initialContent !== editor.getHTML()) {
            editor.commands.setContent(initialContent);
        }
    }, [initialContent, editor]);

    return (
        <div ref={editorContainerRef} className="form-simple-editor w-full rounded-lg border">
            <EditorContext.Provider value={{ editor }}>
                <Toolbar ref={toolbarRef} aria-label="Text formatting" data-stuck={toolbarStuck}>
                    {mobileView === 'main' ? (
                        <MainToolbarContent
                            onHighlighterClick={() => setMobileView('highlighter')}
                            onLinkClick={() => setMobileView('link')}
                            isMobile={isMobile}
                        />
                    ) : (
                        <MobileToolbarContent type={mobileView === 'highlighter' ? 'highlighter' : 'link'} onBack={() => setMobileView('main')} />
                    )}
                </Toolbar>

                <div className="form-simple-editor__body w-full cursor-text" onClick={() => editor?.commands.focus()}>
                    <EditorContent editor={editor} role="presentation" className="simple-editor-content h-full w-full" />
                </div>
                <div className="form-simple-editor__footer">
                    <span title="Estimated at 200 words per minute">{readingStats.readingTime} reading time</span>
                    <span>
                        {readingStats.words.toLocaleString()} {readingStats.words === 1 ? 'word' : 'words'}
                    </span>
                </div>
            </EditorContext.Provider>
        </div>
    );
}
