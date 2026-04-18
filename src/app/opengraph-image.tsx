import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Rent vs Buy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f5f2ec',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Top strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '32px',
            marginBottom: '72px',
          }}
        >
          <div style={{ fontSize: '28px', letterSpacing: '-0.02em', color: '#1a1a1a' }}>
            Rent vs Buy
          </div>
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8a8a8a',
              fontFamily: 'sans-serif',
            }}
          >
            A long-term calculator
          </div>
        </div>

        {/* Hero phrase */}
        <div
          style={{
            fontSize: '88px',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            maxWidth: '1040px',
          }}
        >
          Renting isn&apos;t throwing money away.
        </div>
        <div
          style={{
            fontSize: '88px',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: '#525252',
            fontStyle: 'italic',
            maxWidth: '1040px',
          }}
        >
          Buying isn&apos;t always the answer.
        </div>

        {/* Rule */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#a8a29a',
            marginTop: 'auto',
            marginBottom: '28px',
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            color: '#525252',
          }}
        >
          <span>A calculator for UK homebuyers</span>
          <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '12px', color: '#8a8a8a' }}>
            UK · 2026
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
