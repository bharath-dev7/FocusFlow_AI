import { useEffect, useRef } from 'react';

/**
 * A premium, lightweight SVG-based Sparkline/Area chart for the dashboard.
 * Designed with glassmorphism in mind.
 */
export default function AnalyticsChart({ data, color = 'var(--color-primary)', height = 150 }) {
    const chartRef = useRef(null);

    // Normalize data to fit the height/width
    const maxVal = Math.max(...data, 10);
    const minVal = Math.min(...data);

    // SVG Path Generation
    const generatePath = (width) => {
        if (data.length < 2) return "";
        const step = width / (data.length - 1);
        return data.map((val, i) => {
            const x = i * step;
            const y = height - ((val / maxVal) * height);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(" ");
    };

    const generateAreaPath = (width) => {
        const linePath = generatePath(width);
        if (!linePath) return "";
        return `${linePath} L ${width} ${height} L 0 ${height} Z`;
    };

    return (
        <div ref={chartRef} style={{ width: '100%', height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                    d={generateAreaPath(400)} // Placeholder width, will be stretched by preserveAspectRatio
                    fill="url(#chartGradient)"
                    stroke="none"
                />

                {/* The Line */}
                <path
                    d={generatePath(400)}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.1))' }}
                />
            </svg>

            {/* Grid Lines Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderBottom: '1px solid var(--color-border)', opacity: 0.3 }}></div>
        </div>
    );
}
