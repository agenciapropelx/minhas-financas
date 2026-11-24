import { ImageResponse } from 'next/og';

// Ícone da tela de início do iPhone: o iOS ignora SVG e precisa de PNG quadrado
// sem transparência (ele mesmo arredonda os cantos). Mesmo desenho do icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#217a54' }}>
        <svg width="180" height="180" viewBox="0 0 512 512" fill="none">
          <g stroke="#ffffff" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="256" y1="96" x2="256" y2="416" />
            <path d="M336 152H221a56 56 0 0 0 0 112h70a56 56 0 0 1 0 112H160" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
