"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { Underline } from "@tiptap/extension-underline"
import { Link } from "@tiptap/extension-link"

// --- UI Primitives ---
import { Button } from "@shared/components/tiptap/tiptap-ui-primitive/button"
import { Spacer } from "@shared/components/tiptap/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@shared/components/tiptap/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@shared/components/tiptap/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@shared/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss"
import "@shared/components/tiptap/tiptap-node/code-block-node/code-block-node.scss"
import "@shared/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@shared/components/tiptap/tiptap-node/list-node/list-node.scss"
import "@shared/components/tiptap/tiptap-node/image-node/image-node.scss"
import "@shared/components/tiptap/tiptap-node/heading-node/heading-node.scss"
import "@shared/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@shared/components/tiptap/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@shared/components/tiptap/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@shared/components/tiptap/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@shared/components/tiptap/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@shared/components/tiptap/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@shared/components/tiptap/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@shared/components/tiptap/tiptap-ui/link-popover"
import { MarkButton } from "@shared/components/tiptap/tiptap-ui/mark-button"
import { TextAlignButton } from "@shared/components/tiptap/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@shared/components/tiptap/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@shared/components/tiptap/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@shared/components/tiptap/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@shared/components/tiptap/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@shared/hooks/use-mobile"
import { useWindowSize } from "@shared/hooks/use-window-size"
import { useCursorVisibility } from "@shared/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@shared/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@shared/lib/tiptap-utils"

import content from "@shared/components/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
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
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
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
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

interface FormSimpleEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function FormSimpleEditor({ content: initialContent = '', onChange, placeholder }: FormSimpleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": placeholder || "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      HorizontalRule,
      Link.configure({
        openOnClick: false,
        enableClickSelection: true,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Underline,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent || content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  React.useEffect(() => {
    if (editor && initialContent !== undefined && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor])

  return (
    <div className="border border-input rounded-md" style={{ width: '100%' }}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          style={{
            minHeight: '300px',
            padding: '1rem',
            width: '100%',
            maxWidth: 'none'
          }}
        />
      </EditorContext.Provider>
    </div>
  )
}