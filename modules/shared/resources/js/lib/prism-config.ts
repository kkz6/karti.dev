import Prism from 'prismjs';

// Import theme
import 'prismjs/themes/prism-tomorrow.css';

// Core languages (automatically loaded with Prism core)
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';

// Load languages in proper dependency order
// C must come before C++
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

// Markup templating must come before PHP
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';

// JavaScript must come before JSX, TypeScript, and TSX
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

// Other languages without dependencies
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-swift';

// CSS extensions
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-scss';

// Data formats
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-yaml';

// Documentation and markup
import 'prismjs/components/prism-markdown';

// Database
import 'prismjs/components/prism-sql';

// Shell and scripting
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-shell-session';

// Infrastructure and config
import 'prismjs/components/prism-apacheconf';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-nginx';

// Version control and utilities
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-git';
import 'prismjs/components/prism-regex';

// Language mapping for code block node languages to Prism languages
export const LANGUAGE_MAP: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'python',
    java: 'java',
    csharp: 'csharp',
    cpp: 'cpp',
    c: 'c',
    php: 'php',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    swift: 'swift',
    kotlin: 'kotlin',
    scala: 'scala',
    html: 'markup',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    toml: 'toml',
    markdown: 'markdown',
    sql: 'sql',
    bash: 'bash',
    shell: 'bash',
    powershell: 'powershell',
    dockerfile: 'docker',
    nginx: 'nginx',
    apache: 'apacheconf',
    diff: 'diff',
    git: 'git',
    regex: 'regex',
    plaintext: 'plaintext',
};

/**
 * Highlight code using Prism
 * @param code - The code to highlight
 * @param language - The language identifier
 * @returns Highlighted HTML string
 */
export function highlightCode(code: string, language: string): string {
    const prismLanguage = LANGUAGE_MAP[language] || 'plaintext';

    // Return plain text for plaintext or unknown languages
    if (prismLanguage === 'plaintext' || !Prism.languages[prismLanguage]) {
        return Prism.util.encode(code) as string;
    }

    try {
        return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage) as string;
    } catch (error) {
        console.warn(`Failed to highlight code for language "${prismLanguage}":`, error);
        return Prism.util.encode(code) as string;
    }
}

/**
 * Check if a language is supported by Prism
 * @param language - The language identifier
 * @returns Whether the language is supported
 */
export function isLanguageSupported(language: string): boolean {
    const prismLanguage = LANGUAGE_MAP[language];
    return !!(prismLanguage && prismLanguage !== 'plaintext' && Prism.languages[prismLanguage]);
}

export default Prism;
