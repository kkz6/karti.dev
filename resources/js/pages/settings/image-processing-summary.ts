function optionValue(options: string[], flag: string) {
    const joined = options.join(' ');
    return joined.match(new RegExp(`(?:^|\\s)${flag}(?:=|\\s+)?([\\d.-]+)(?:\\s|$)`))?.[1];
}

export function compressionSummary(name: string, options: string[]) {
    const value = (flag: string, suffix = '') => {
        const found = optionValue(options, flag);
        return found ? `${found}${suffix}` : 'Tool default';
    };
    switch (name) {
        case 'Jpegoptim':
            return {
                setting: 'Maximum quality',
                value: value('--max', '%'),
                note: [options.includes('--all-progressive') && 'Progressive loading', options.includes('--strip-all') && 'Metadata removed']
                    .filter(Boolean)
                    .join(' · '),
            };
        case 'Pngquant':
            return {
                setting: 'Quality',
                value: value('--quality', '%'),
                note: options.includes('--skip-if-larger') ? 'Skip if the result is larger' : 'Color compression',
            };
        case 'Optipng':
            return { setting: 'Optimization level', value: value('-o'), note: 'Lossless optimization pass' };
        case 'Gifsicle':
            return { setting: 'Optimization level', value: value('-O'), note: 'GIF optimization' };
        case 'Cwebp':
            return { setting: 'Quality', value: value('-q', '%'), note: `Encoding method: ${value('-m')} · Passes: ${value('-pass')}` };
        case 'Avifenc':
            return { setting: 'Quantizer', value: value('cq-level'), note: 'Lower values mean higher quality; not a percentage' };
        default:
            return { setting: 'Configuration', value: 'Custom', note: 'See developer configuration below' };
    }
}
