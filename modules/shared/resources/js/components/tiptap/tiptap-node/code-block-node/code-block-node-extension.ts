import { Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeBlockNodeView } from './code-block-node-view'

export interface CodeBlockOptions {
  /**
   * Language class prefix
   * @default 'language-'
   */
  languageClassPrefix: string
  
  /**
   * Default language
   * @default 'auto'
   */
  defaultLanguage: string | null
  
  /**
   * HTML attributes to add to the code block element
   * @default {}
   */
  HTMLAttributes: Record<string, any>
  
  /**
   * Whether to enable syntax highlighting
   * @default true
   */
  syntaxHighlighting: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customCodeBlock: {
      /**
       * Set a code block
       */
      setCodeBlock: (attributes?: { language?: string }) => ReturnType
      /**
       * Toggle a code block
       */
      toggleCodeBlock: (attributes?: { language?: string }) => ReturnType
    }
  }
}

export const backtickInputRegex = /^```([a-z]*)?[\s\n]$/
export const tildeInputRegex = /^~~~([a-z]*)?[\s\n]$/

export const CodeBlock = Node.create<CodeBlockOptions>({
  name: 'codeBlock',

  addOptions() {
    return {
      languageClassPrefix: 'language-',
      defaultLanguage: null,
      HTMLAttributes: {},
      syntaxHighlighting: true,
    }
  },

  content: 'text*',

  marks: '',

  group: 'block',

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: element => {
          const { languageClassPrefix } = this.options
          const classNames = [...(element.firstElementChild?.classList || [])]
          const languages = classNames
            .filter(className => className.startsWith(languageClassPrefix))
            .map(className => className.replace(languageClassPrefix, ''))
          const language = languages[0]

          if (!language) {
            return null
          }

          return language
        },
        rendered: false,
      },
      lineNumbers: {
        default: false,
        parseHTML: element => {
          const attr = element.getAttribute('data-line-numbers')
          return attr === 'true'
        },
        renderHTML: attributes => {
          return {
            'data-line-numbers': attributes.lineNumbers ? 'true' : 'false',
          }
        },
      },
      wrap: {
        default: true,
        parseHTML: element => {
          const attr = element.getAttribute('data-wrap')
          return attr !== 'false'
        },
        renderHTML: attributes => {
          return {
            'data-wrap': attributes.wrap ? 'true' : 'false',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        'code',
        node.attrs.language
          ? { class: this.options.languageClassPrefix + node.attrs.language }
          : {},
        0,
      ],
    ]
  },

  addCommands() {
    return {
      setCodeBlock:
        attributes =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes)
        },
      toggleCodeBlock:
        attributes =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', attributes)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),

      // remove code block when at start of document or code block is empty
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection
        const isAtStart = $anchor.pos === 1

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes()
        }

        return false
      },

      // exit node on triple enter
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from, empty } = selection

        if (!empty || $from.parent.type !== this.type) {
          return false
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2
        const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n')

        if (!isAtEnd || !endsWithDoubleNewline) {
          return false
        }

        return editor
          .chain()
          .command(({ tr }) => {
            tr.delete($from.pos - 2, $from.pos)
            return true
          })
          .exitCode()
          .run()
      },

      // exit node on arrow down
      ArrowDown: ({ editor }) => {
        const { state } = editor
        const { selection, doc } = state
        const { $from, empty } = selection

        if (!empty || $from.parent.type !== this.type) {
          return false
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2

        if (!isAtEnd) {
          return false
        }

        const after = $from.after()

        if (after === undefined) {
          return false
        }

        const nodeAfter = doc.nodeAt(after)

        if (nodeAfter) {
          return false
        }

        return editor.commands.exitCode()
      },
    }
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: match => ({
          language: match[1],
        }),
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: match => ({
          language: match[1],
        }),
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView)
  },
})
