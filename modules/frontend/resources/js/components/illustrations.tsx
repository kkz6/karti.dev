import type { ComponentPropsWithoutRef } from 'react'

/**
 * Blueprint-style line art built from the theme's own tokens.
 * Everything strokes with currentColor or CSS variables, so a single set of
 * drawings works in both light and dark without a second asset.
 */

type SvgProps = ComponentPropsWithoutRef<'svg'>

export function CodeGlyph(props: SvgProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
            <rect x="4.5" y="8.5" width="39" height="31" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4.5 16.5h39" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9.5" cy="12.5" r="1.25" fill="currentColor" />
            <circle cx="14" cy="12.5" r="1.25" fill="currentColor" />
            <circle cx="18.5" cy="12.5" r="1.25" fill="currentColor" />
            <path
                d="m18 23-5 5 5 5M30 23l5 5-5 5M26.5 21.5l-5 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function VisaGlyph(props: SvgProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
            <rect x="9.5" y="5.5" width="29" height="37" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M15 5.5v37" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="27.5" cy="19" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M27.5 12.5c-3 3.2-3 9.8 0 13M27.5 12.5c3 3.2 3 9.8 0 13M21 19h13"
                stroke="currentColor"
                strokeWidth="1.2"
            />
            {/* approval stamp */}
            <rect
                x="19"
                y="30"
                width="15"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="2.5 2"
                transform="rotate(-8 26.5 34)"
            />
            <path
                d="m22.5 34 2.5 2.4 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="rotate(-8 26.5 34)"
            />
        </svg>
    )
}

export function HomeGlyph(props: SvgProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
            <path
                d="M7.5 21 24 8l16.5 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M11 24v15.5h26V24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            {/* automation signal */}
            <circle cx="24" cy="31" r="2" fill="currentColor" />
            <path d="M19.5 26.5a6.5 6.5 0 0 1 9 0M16.5 23a11 11 0 0 1 15 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    )
}

export function NetworkGlyph(props: SvgProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
            <rect x="17.5" y="17.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="40" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="m10.5 10.5 7 7M37.5 10.5l-7 7M10.5 37.5l7-7M37.5 37.5l-7-7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
            />
        </svg>
    )
}

/**
 * House elevation for the Airbnb section — lit windows to read as "a place to
 * stay", with wifi and automation nodes layered on to say whose house it is.
 * Sized to sit inside a column rather than stretch as a background.
 */
export function HouseScene(props: SvgProps) {
    return (
        <svg viewBox="0 0 420 330" fill="none" aria-hidden="true" {...props}>
            {/* wifi arcs over the roof */}
            <g stroke="var(--primary)" strokeLinecap="round" fill="none" opacity="0.75">
                <path d="M186 62a34 34 0 0 1 48 0" strokeWidth="2" />
                <path d="M172 46a54 54 0 0 1 76 0" strokeWidth="2" opacity="0.6" />
                <path d="M158 30a74 74 0 0 1 104 0" strokeWidth="2" opacity="0.35" />
            </g>
            <circle cx="210" cy="76" r="4" fill="var(--primary)" />

            {/* chimney */}
            <path d="M296 108V74h26v56" stroke="var(--border)" strokeWidth="2.5" strokeLinejoin="round" />

            {/* roof */}
            <path
                d="M64 158 210 66l146 92"
                stroke="var(--foreground)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* walls */}
            <path d="M92 150v134h236V150" stroke="var(--foreground)" strokeWidth="3" strokeLinejoin="round" />

            {/* ground */}
            <path d="M40 284h340" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />

            {/* lit windows */}
            <g>
                <rect x="121" y="180" width="56" height="46" rx="4" fill="var(--primary)" opacity="0.18" />
                <rect x="121" y="180" width="56" height="46" rx="4" stroke="var(--foreground)" strokeWidth="2.5" />
                <path d="M149 180v46M121 203h56" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.7" />

                <rect x="243" y="180" width="56" height="46" rx="4" fill="var(--primary)" opacity="0.18" />
                <rect x="243" y="180" width="56" height="46" rx="4" stroke="var(--foreground)" strokeWidth="2.5" />
                <path d="M271 180v46M243 203h56" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.7" />
            </g>

            {/* door */}
            <rect x="185" y="212" width="50" height="72" rx="4" fill="var(--primary)" opacity="0.12" />
            <rect x="185" y="212" width="50" height="72" rx="4" stroke="var(--foreground)" strokeWidth="2.5" />
            <circle cx="224" cy="250" r="3" fill="var(--foreground)" />

            {/* automation nodes linked back to the house */}
            <g stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6">
                <path d="M92 168H54v58" />
                <path d="M328 168h38v58" />
            </g>
            <circle cx="54" cy="232" r="6" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
            <circle cx="366" cy="232" r="6" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />

            {/* a little planting so it reads as a home, not a diagram */}
            <g stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.55">
                <path d="M104 284v-22M104 268l-9-8M104 272l9-9" />
                <path d="M316 284v-16M316 272l-8-7M316 276l8-7" />
            </g>
        </svg>
    )
}

/**
 * The hero composition: a system diagram with the four things I do orbiting a
 * central node. Orbit rings animate via the `.orbit-dash` class.
 */
export function HeroDiagram(props: SvgProps) {
    const satellites = [
        { cx: 240, cy: 60, Glyph: CodeGlyph, label: 'software' },
        { cx: 400, cy: 240, Glyph: VisaGlyph, label: 'visas' },
        { cx: 240, cy: 420, Glyph: HomeGlyph, label: 'homes' },
        { cx: 80, cy: 240, Glyph: NetworkGlyph, label: 'networks' },
    ]

    return (
        <svg viewBox="0 0 480 480" fill="none" aria-hidden="true" {...props}>
            <defs>
                <pattern id="hero-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M30 0H0v30" stroke="var(--border)" strokeWidth="1" fill="none" />
                </pattern>
                <radialGradient id="hero-fade" cx="50%" cy="50%" r="50%">
                    <stop offset="55%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id="hero-mask">
                    <rect width="480" height="480" fill="url(#hero-fade)" />
                </mask>
            </defs>

            <rect width="480" height="480" fill="url(#hero-grid)" mask="url(#hero-mask)" />

            {/* orbits */}
            <g mask="url(#hero-mask)">
                <circle cx="240" cy="240" r="180" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 6" className="orbit-dash" />
                <circle cx="240" cy="240" r="120" stroke="var(--border)" strokeWidth="1" />
                <circle cx="240" cy="240" r="60" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 5" />
            </g>

            {/* spokes */}
            <g stroke="var(--primary)" strokeWidth="1" opacity="0.35">
                <path d="M240 240 240 92M240 240 368 240M240 240 240 388M240 240 112 240" />
            </g>

            {/* central node */}
            <g>
                <rect x="204" y="204" width="72" height="72" rx="18" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" />
                <text
                    x="240"
                    y="246"
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="15"
                    fill="var(--primary)"
                >
                    ~/
                </text>
            </g>

            {/* satellites */}
            {satellites.map(({ cx, cy, Glyph, label }) => (
                <g key={label}>
                    <rect
                        x={cx - 34}
                        y={cy - 34}
                        width="68"
                        height="68"
                        rx="16"
                        fill="var(--card)"
                        stroke="var(--border)"
                        strokeWidth="1.5"
                    />
                    <Glyph x={cx - 18} y={cy - 22} width="36" height="36" className="text-primary" />
                    <text
                        x={cx}
                        y={cy + 26}
                        textAnchor="middle"
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="8.5"
                        letterSpacing="0.5"
                        fill="var(--muted-foreground)"
                    >
                        {label}
                    </text>
                </g>
            ))}
        </svg>
    )
}
