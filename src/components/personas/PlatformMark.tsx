/**
 * PlatformMark: simplified, recognisable platform glyphs.
 *
 * Deliberately geometric reconstructions rather than traced trademark
 * files: they read correctly at 20px, carry the official brand colour,
 * and ship no third-party asset. Recognition comes from silhouette plus
 * colour, which is what the eye actually uses at this size.
 */
export default function PlatformMark({ id, color, size = 22 }: { id: string; color: string; size?: number }) {
  const c = color;
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const };

  switch (id) {
    case "youtube":
      return (
        <svg {...common}>
          <rect x="1" y="5" width="22" height="14" rx="4.5" fill={c} />
          <path d="M10 8.8v6.4L15.6 12 10 8.8z" fill="#fff" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill={c} />
          <path d="M13.4 20v-7h2.3l.4-2.8h-2.7V8.4c0-.8.2-1.3 1.4-1.3h1.4V4.6c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.1H8.3V13h2.3v7h2.8z" fill="#fff" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="6" fill={c} />
          <circle cx="12" cy="12" r="4.6" fill="none" stroke="#fff" strokeWidth="1.9" />
          <circle cx="17.4" cy="6.6" r="1.3" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
          <path d="M16.4 6.2c-.9-.6-1.5-1.6-1.6-2.7h-2.5v10.9c0 1.2-1 2.2-2.2 2.2s-2.2-1-2.2-2.2 1-2.2 2.2-2.2c.2 0 .5 0 .7.1V9.5c-.2 0-.5-.1-.7-.1-2.6 0-4.7 2.1-4.7 4.7s2.1 4.7 4.7 4.7 4.7-2.1 4.7-4.7V8.9c1 .7 2.2 1.1 3.4 1.1V7.5c-.7 0-1.4-.2-1.8-.5z" fill={c} />
          <path d="M15.6 5.4c-.9-.6-1.5-1.6-1.6-2.7h-2.5v10.9c0 1.2-1 2.2-2.2 2.2-.5 0-1-.2-1.4-.5.4.6 1.1 1 1.9 1 1.2 0 2.2-1 2.2-2.2V3.2h2.5c.1.8.5 1.6 1.1 2.2z" fill="#25F4EE" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill={c} />
          <path d="M12 5.4c-3.6 0-6.6 2.9-6.6 6.6 0 1.2.3 2.3.9 3.2l-1 3.4 3.5-.9c.9.5 1.9.8 3.1.8h.1c3.6 0 6.6-3 6.6-6.6S15.7 5.4 12 5.4zm3.8 9.3c-.2.5-.9.9-1.3.9-.4.1-.8.1-2.5-.6-2.1-.9-3.4-3-3.5-3.2-.1-.1-.8-1.1-.8-2.1s.5-1.5.7-1.7c.2-.2.4-.3.6-.3h.4c.1 0 .3-.1.5.4l.7 1.6c.1.1.1.3 0 .4l-.2.4-.3.3c-.1.1-.2.2-.1.4.1.2.5.9 1.1 1.4.8.7 1.4.9 1.6 1 .2.1.3.1.4-.1l.6-.7c.1-.2.3-.1.4-.1l1.5.7c.2.1.4.2.4.3.1.1.1.5 0 .9z" fill="#fff" />
        </svg>
      );
    case "reddit":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="11" fill={c} />
          <circle cx="12" cy="13.4" r="6.4" fill="#fff" />
          <circle cx="9.6" cy="12.9" r="1.1" fill={c} />
          <circle cx="14.4" cy="12.9" r="1.1" fill={c} />
          <path d="M9.6 15.8c1.4.9 3.4.9 4.8 0" stroke={c} strokeWidth="1" strokeLinecap="round" fill="none" />
          <circle cx="17.6" cy="8.2" r="1.7" fill="#fff" />
          <path d="M12 7.1l.9-3.4 2.9.7" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "snapchat":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="6" fill={c} />
          <path d="M12 4.8c2.2 0 3.6 1.6 3.6 3.9 0 .6-.1 1.3-.1 1.5.2.1.6.2.9.1.4-.1.7.2.7.5s-.4.6-1 .8c-.4.1-.6.2-.5.6.2.7 1.4 2.2 2.6 2.5.3.1.4.3.3.5-.2.4-1.1.7-1.8.8-.2 0-.3.2-.3.4-.1.4-.2.6-.5.6-.4 0-.9-.2-1.6-.1-.7.1-1.3.9-2.3.9s-1.6-.8-2.3-.9c-.7-.1-1.2.1-1.6.1-.3 0-.4-.2-.5-.6 0-.2-.1-.4-.3-.4-.7-.1-1.6-.4-1.8-.8-.1-.2 0-.4.3-.5 1.2-.3 2.4-1.8 2.6-2.5.1-.4-.1-.5-.5-.6-.6-.2-1-.5-1-.8s.3-.6.7-.5c.3.1.7 0 .9-.1 0-.2-.1-.9-.1-1.5 0-2.3 1.4-3.9 3.6-3.9z" fill="#fff" stroke="#111" strokeWidth="0.4" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
          <path d="M16.8 5.8h2.3l-5 5.7 5.9 7.8h-4.6l-3.6-4.7-4.1 4.7H5.4l5.4-6.2-5.6-7.3h4.7l3.3 4.3 3.6-4.3zm-.8 12.1h1.3L9 7h-1.4l8.4 10.9z" fill={c} />
        </svg>
      );
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" fill={c} /></svg>;
  }
}
