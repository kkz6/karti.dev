import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { cn } from '@shared/lib/utils';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Check, ChevronDown, Copy, ListOrdered, Trash2, WrapText } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Import Prism for syntax highlighting
import Prism from '@shared/lib/prism-config';

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
];

export function CodeBlockNodeView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const codeRef = useRef<HTMLDivElement>(null);
    const language = node.attrs.language || 'plaintext';
    const lineNumbers = !!node.attrs.lineNumbers;
    const wrap = node.attrs.wrap !== false;

    // Get the current content
    const content = node.textContent;

    // Apply syntax highlighting using Prism
    useEffect(() => {
        if (!codeRef.current || !language || language === 'plaintext') return;

        const timer = setTimeout(() => {
            try {
                // Find the NodeViewContent element (try multiple selectors)
                let nodeViewContent =
                    codeRef.current?.querySelector('[contenteditable="true"]') ||
                    codeRef.current?.querySelector('.ProseMirror') ||
                    codeRef.current?.querySelector('[data-node-view-content]') ||
                    codeRef.current?.querySelector('.code-block-content');

                if (!nodeViewContent || !content) {
                    return;
                }

                // Clean the content - remove any extra whitespace or "Copy" text
                const cleanContent = content.trim().replace(/\s*Copy\s*$/, '');
                if (!cleanContent) {
                    return;
                }

                // Create a temporary pre/code structure for Prism to process
                const tempCode = document.createElement('code');
                tempCode.className = `language-${language}`;
                tempCode.textContent = cleanContent;

                // Highlight the temporary element
                Prism.highlightElement(tempCode);
                const highlightedHTML = tempCode.innerHTML;

                // Check if highlighting actually happened
                const hasTokens = highlightedHTML.includes('class="token');

                if (!hasTokens) {
                    return;
                }

                // Create or update syntax highlight overlay
                let overlay = codeRef.current?.querySelector('.syntax-highlight-overlay') as HTMLElement;

                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'syntax-highlight-overlay';
                    // Get the computed styles from the editable element to match exactly
                    const computedStyles = window.getComputedStyle(nodeViewContent as Element);
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                        font-family: ${computedStyles.fontFamily};
                        font-size: ${computedStyles.fontSize};
                        line-height: ${computedStyles.lineHeight};
                        padding: ${computedStyles.padding};
                        white-space: ${computedStyles.whiteSpace};
                        overflow: hidden;
                        z-index: 1;
                    `;
                    codeRef.current?.appendChild(overlay);
                }

                // Apply highlighted content to overlay
                overlay.innerHTML = highlightedHTML;

                // Make the editable content transparent
                (nodeViewContent as HTMLElement).style.color = 'transparent';
                (nodeViewContent as HTMLElement).style.caretColor = 'hsl(var(--foreground))';
                (nodeViewContent as HTMLElement).style.position = 'relative';
                (nodeViewContent as HTMLElement).style.zIndex = '2';
            } catch (error) {
                // Silent fail
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [content, language]);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.warn('Failed to copy code:', error);
        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        updateAttributes({ language: newLanguage === 'plaintext' ? null : newLanguage });
    };

    const toggleLineNumbers = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttributes({ lineNumbers: !lineNumbers });
    };

    const toggleWrap = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttributes({ wrap: !wrap });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const pos = typeof getPos === 'function' ? getPos() : null;
            if (pos != null) {
                const from = pos;
                const to = pos + node.nodeSize;
                editor?.chain().focus().deleteRange({ from, to }).run();
            } else {
                // fallback: clear to paragraph
                editor?.chain().focus().setNode('paragraph').run();
            }
        } catch {}
    };

    const selectedLanguage = useMemo(() => {
        return LANGUAGES.find((lang) => lang.value === language) || LANGUAGES.find((lang) => lang.value === 'plaintext');
    }, [language]);

    return (
        <NodeViewWrapper
            className={cn(
                'code-block border-input ring-border bg-muted/30 not-prose relative rounded-lg border ring-1',
                selected && 'ring-ring ring-2 ring-offset-2',
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header with language selector and controls */}
            <div
                className={cn(
                    'code-block-header bg-muted/50 flex items-center justify-between rounded-t-lg border-b px-3 py-2 transition-opacity',
                    !isHovered && !selected && 'opacity-70',
                )}
            >
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-medium">
                                {selectedLanguage?.label}
                                <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-60 overflow-y-auto">
                            {LANGUAGES.map((lang) => (
                                <DropdownMenuItem key={lang.value} onClick={() => handleLanguageChange(lang.value)} className="text-xs">
                                    {lang.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={toggleLineNumbers} className="h-6 w-6 p-0" title="Toggle line numbers">
                        <ListOrdered className="h-3 w-3" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={toggleWrap} className="h-6 w-6 p-0" title="Toggle word wrap">
                        <WrapText className="h-3 w-3" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0" title="Copy code">
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="h-6 w-6 p-0" title="Delete code block">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Content with optional line numbers gutter */}
            <div className={cn(lineNumbers ? 'grid grid-cols-[2.25rem_1fr]' : '')}>
                {lineNumbers && (
                    <div className="text-muted-foreground/70 border-border bg-muted/30 border-r py-2 pr-2 font-mono text-sm leading-[1.5] select-none">
                        {content.split('\n').map((_, idx) => (
                            <div key={idx} className="text-right" style={{ lineHeight: '1.5', fontSize: '14px', height: '21px' }}>
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                )}
                <div ref={codeRef} className="relative">
                    <NodeViewContent
                        className={cn(
                            'code-block-content bg-background text-foreground',
                            'p-2 font-mono text-sm',
                            wrap ? 'break-words whitespace-pre-wrap' : 'overflow-x-auto whitespace-pre',
                            `language-${language}`,
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
            </div>
        </NodeViewWrapper>
    );
}
