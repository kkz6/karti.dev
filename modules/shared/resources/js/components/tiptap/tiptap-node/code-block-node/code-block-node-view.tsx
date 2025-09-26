import React, { useState, useMemo } from 'react'
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/button'
import { Copy, Check, ChevronDown, WrapText, ListOrdered, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'

// Language definitions - common programming languages
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'scala', label: 'Scala' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'Less' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'toml', label: 'TOML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'diff', label: 'Diff' },
  { value: 'git', label: 'Git' },
  { value: 'regex', label: 'RegEx' },
  { value: 'plaintext', label: 'Plain Text' },
]

export function CodeBlockNodeView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const language = node.attrs.language || 'plaintext'
  const lineNumbers = !!node.attrs.lineNumbers
  const wrap = node.attrs.wrap !== false

  // Get the current content
  const content = node.textContent

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn('Failed to copy code:', error)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    updateAttributes({ language: newLanguage === 'plaintext' ? null : newLanguage })
  }

  const toggleLineNumbers = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    updateAttributes({ lineNumbers: !lineNumbers })
  }

  const toggleWrap = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    updateAttributes({ wrap: !wrap })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const pos = typeof getPos === 'function' ? getPos() : null
      if (pos != null) {
        const from = pos
        const to = pos + node.nodeSize
        editor?.chain().focus().deleteRange({ from, to }).run()
      } else {
        // fallback: clear to paragraph
        editor?.chain().focus().setNode('paragraph').run()
      }
    } catch {}
  }

  const selectedLanguage = useMemo(() => {
    return LANGUAGES.find(lang => lang.value === language) || LANGUAGES.find(lang => lang.value === 'plaintext')
  }, [language])

  return (
    <NodeViewWrapper
      className={cn(
        'code-block relative rounded-lg border border-input ring-1 ring-border bg-muted/30 not-prose',
        selected && 'ring-2 ring-ring ring-offset-2'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {/* Header with language selector and controls */}
      <div className={cn(
        'code-block-header flex items-center justify-between px-3 py-2 border-b bg-muted/50 rounded-t-lg transition-opacity',
        !isHovered && !selected && 'opacity-70'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-medium">
              {selectedLanguage?.label}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className="text-xs"
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={toggleLineNumbers} className="h-6 w-6 p-0" tooltip="Toggle line numbers">
            <ListOrdered className="h-3 w-3" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={toggleWrap} className="h-6 w-6 p-0" tooltip="Toggle wrap">
            <WrapText className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
            tooltip="Copy"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="h-6 w-6 p-0" tooltip="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content with optional line numbers gutter */}
      <div className={cn(lineNumbers ? 'grid grid-cols-[2.25rem_1fr]' : '')}>
        {lineNumbers && (
          <div className="select-none text-[11px] text-muted-foreground/70 border-r border-border bg-muted/30 py-2 pr-2 leading-[1.5] font-mono">
            {content.split('\n').map((_, idx) => (
              <div key={idx} className="text-right h-[1.5em]">{idx + 1}</div>
            ))}
          </div>
        )}
        <NodeViewContent
          className={cn(
            'code-block-content bg-background text-foreground',
            'p-2 font-mono text-sm',
            wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto',
            `language-${language}`
          )}
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            margin: 0,
            border: 0,
            borderRadius: 0,
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}
