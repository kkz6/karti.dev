import * as React from 'react';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';

// --- Enhanced Code Block Styles ---
import '@shared/components/tiptap/tiptap-node/code-block-node/code-block-node.scss';
import 'prism-code-editor/layout.css';
import 'prism-code-editor/themes/github-dark.css';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';

// --- UI Primitives ---
import { Button } from '@shared/components/tiptap/tiptap-ui-primitive/button';
import { Spacer } from '@shared/components/tiptap/tiptap-ui-primitive/spacer';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@shared/components/tiptap/tiptap-ui-primitive/toolbar';

// --- Tiptap Node ---
import { ImageUploadNode } from '@shared/components/tiptap/tiptap-node/image-upload-node/image-upload-node-extension';
import { HorizontalRule } from '@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import { ResizableImage } from '@shared/components/tiptap/extensions/resizable-image/resizable-image-extension';
import { CodeBlock } from '@shared/components/tiptap/tiptap-node/code-block-node';

// --- Tiptap UI ---
import { HeadingDropdownMenu } from '@shared/components/tiptap/tiptap-ui/heading-dropdown-menu';
import { ImageUploadButton } from '@shared/components/tiptap/tiptap-ui/image-upload-button';
import { ListDropdownMenu } from '@shared/components/tiptap/tiptap-ui/list-dropdown-menu';
import { BlockquoteButton } from '@shared/components/tiptap/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@shared/components/tiptap/tiptap-ui/code-block-button';
import { MarkButton } from '@shared/components/tiptap/tiptap-ui/mark-button';
import { TextAlignButton } from '@shared/components/tiptap/tiptap-ui/text-align-button';
import { UndoRedoButton } from '@shared/components/tiptap/tiptap-ui/undo-redo-button';

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@shared/lib/tiptap-utils';

// --- Styles ---
import '@shared/components/tiptap/tiptap-ui-primitive/button/button.scss';
import '@shared/components/tiptap/tiptap-ui-primitive/button/button-colors.scss';
import '@shared/components/tiptap/tiptap-ui-primitive/toolbar/toolbar.scss';
import '@shared/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss';
import '@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@shared/components/tiptap/tiptap-node/list-node/list-node.scss';
import '@shared/components/tiptap/tiptap-node/image-node/image-node.scss';
import '@shared/components/tiptap/tiptap-node/heading-node/heading-node.scss';
import '@shared/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss';
import '@shared/components/tiptap/extensions/resizable-image/resizable-image.scss';

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({ content = '', onChange, placeholder = 'Start writing...', className }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': placeholder,
        class: `prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] p-4 ${className || ''}`,
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false, // Disable default code block to use enhanced version
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
      Link.configure({
        openOnClick: false,
        enableClickSelection: true,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'tiptap-resizable-image',
        },
      }),
      Typography,
      Underline,
      Superscript,
      Subscript,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('Upload failed:', error),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input rounded-md">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar className="border-b border-input">
          <ToolbarGroup>
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
            <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} />
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
            <ImageUploadButton text="Image" />
          </ToolbarGroup>

          <Spacer />
        </Toolbar>

        <EditorContent
          editor={editor}
          className="min-h-[200px]"
        />
      </EditorContext.Provider>
    </div>
  );
}
