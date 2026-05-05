interface IconProps {
  size?: number;
  className?: string;
}

export function InstagramIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig1)" />
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  );
}

export function TikTokIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.44a8.28 8.28 0 004.84 1.55V6.54a4.85 4.85 0 01-1.07-.15v.3z"
        fill="white"
      />
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.44a8.28 8.28 0 004.84 1.55V6.54a4.85 4.85 0 01-1.07-.15"
        fill="#69C9D0"
        opacity="0.5"
      />
    </svg>
  );
}

export function YouTubeIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path
        d="M22.54 6.42a2.78 2.78 0 00-1.94-1.97C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 001.46 6.42 29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.97 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"
        fill="white"
        opacity="0.9"
      />
      <polygon points="9.75,8.5 15.5,11.75 9.75,15" fill="#FF0000" />
    </svg>
  );
}

export function TwitterXIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path
        d="M13.66 10.37L19.48 3.6h-1.39L13.04 9.5 9.28 3.6H4.4l6.1 8.87L4.4 20.4h1.39l5.33-6.2 4.25 6.2h4.88l-6.59-9.63zm-1.89 2.19l-.62-.88L6.3 4.63h2.11l3.97 5.68.62.88 5.14 7.36h-2.11l-4.26-6.1z"
        fill="white"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path
        d="M16.5 2h-2.83C11.5 2 10 3.57 10 5.71V8H7.5v3H10v7h3V11h2.5l.5-3H13V5.71c0-.67.33-1.21 1-1.21h2.5V2z"
        fill="white"
      />
    </svg>
  );
}

export function TelegramIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#37aee2" />
          <stop offset="100%" stopColor="#1e96c8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#tg1)" />
      <path
        d="M5.5 11.6l12.4-4.8c.6-.2 1.1.1.9.9l-2.1 9.8c-.2.7-.6.9-1.1.5l-3-2.3-1.4 1.4c-.2.2-.4.3-.7.3l.2-3.2 5.4-4.9c.2-.2 0-.3-.3-.1L7.7 13.4l-2.8-.9c-.6-.2-.6-.6.6-1z"
        fill="white"
      />
    </svg>
  );
}

export function SnapchatIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#FFFC00" />
      <path
        d="M12 3.5c-2.5 0-4.5 2-4.5 4.5v1.5c-.5 0-1 .3-1.2.8-.2.5 0 1 .5 1.2.4.2.3.7.1 1.2-.4.9-1.5 1.5-1.5 1.5.6.1 1.2.5 1.7.9.3.3.5.5.5.7 0 .4-.3.6-.7.6-.4 0-.9-.2-.9-.2s0 .5.5.9c.5.3 1.1.4 1.4.4.5.6 1.3.9 2.1.9 1.2 0 2.2-.7 3.1-.7.9 0 1.9.7 3.1.7.8 0 1.6-.3 2.1-.9.3 0 .9-.1 1.4-.4.5-.4.5-.9.5-.9s-.5.2-.9.2c-.4 0-.7-.2-.7-.6 0-.2.2-.4.5-.7.5-.4 1.1-.8 1.7-.9 0 0-1.1-.6-1.5-1.5-.2-.5-.3-1 .1-1.2.5-.2.7-.7.5-1.2-.2-.5-.7-.8-1.2-.8V8c0-2.5-2-4.5-4.5-4.5z"
        fill="#1A1A1A"
      />
    </svg>
  );
}

export function ThreadsIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path
        d="M16.5 11.5c-.1-.5-.4-1-.7-1.4-.5-.6-1.2-1-2-1.1-.5-.1-1-.1-1.5.1-.7.2-1.3.6-1.7 1.2-.3.4-.5 1-.5 1.5 0 .6.1 1.2.4 1.7.4.7 1 1.2 1.8 1.4.6.1 1.2.1 1.8-.1.7-.3 1.3-.8 1.7-1.5.2-.4.4-.8.4-1.3 0-.2 0-.4-.1-.5h-3.5c0 .4.1.8.4 1.1.2.3.5.4.8.4.3 0 .6-.1.8-.3.1-.1.2-.3.2-.4h.9c-.1.5-.3 1-.7 1.4-.5.5-1.2.8-1.9.8-.8 0-1.5-.3-2.1-.9-.5-.5-.8-1.2-.8-2 0-.7.2-1.5.7-2 .5-.6 1.2-1 2-1.1.5-.1 1.1-.1 1.6.1.7.2 1.3.7 1.8 1.3.3.4.5.9.6 1.4"
        fill="white"
        strokeWidth="0"
      />
    </svg>
  );
}

export function SoundCloudIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#FF5500" />
      <path
        d="M2.5 14.5c0 .8.7 1.5 1.5 1.5h14c1.4 0 2.5-1.1 2.5-2.5 0-1.2-.9-2.2-2-2.4V11c0-2.2-1.8-4-4-4-.9 0-1.7.3-2.4.8C11.7 6.7 10.4 6 9 6c-2.2 0-4 1.8-4 4 0 .1 0 .3.1.4-.4.4-.6.9-.6 1.6v.5l-.1.2c-.5.2-.9.7-.9 1.3v1z"
        fill="white"
      />
    </svg>
  );
}

export function SpotifyIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#1DB954" />
      <path
        d="M12 4a8 8 0 100 16A8 8 0 0012 4zm3.67 11.57a.5.5 0 01-.69.16c-1.9-1.16-4.3-1.42-7.12-.78a.5.5 0 01-.22-.97c3.09-.7 5.74-.4 7.87.9a.5.5 0 01.16.69zm.98-2.19a.63.63 0 01-.86.2c-2.18-1.34-5.49-1.73-8.07-.94a.63.63 0 01-.37-1.2c2.94-.9 6.6-.46 9.1 1.08a.63.63 0 01.2.86zm.08-2.28c-2.61-1.55-6.92-1.69-9.41-.94a.75.75 0 01-.44-1.44c2.87-.87 7.63-.7 10.64 1.09a.75.75 0 01-.79 1.29z"
        fill="white"
      />
    </svg>
  );
}

export function PinterestIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#E60023" />
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.19-.77 1.27-5.37 1.27-5.37s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.55 1.97 1.62 1.97 1.95 0 3.26-2.51 3.26-5.47 0-2.26-1.51-3.83-3.67-3.83-2.49 0-3.95 1.87-3.95 3.8 0 .75.29 1.55.65 1.99a.26.26 0 01.06.25c-.07.27-.21.87-.24 1-.04.16-.13.2-.29.12-1.07-.5-1.74-2.07-1.74-3.33 0-2.71 1.97-5.2 5.68-5.2 2.98 0 5.3 2.12 5.3 4.96 0 2.96-1.87 5.34-4.46 5.34-.87 0-1.69-.45-1.97-.99l-.54 2c-.19.75-.72 1.69-1.07 2.26.81.25 1.66.38 2.55.38 5.52 0 10-4.48 10-10S17.52 2 12 2z"
        fill="white"
      />
    </svg>
  );
}

export function LinkedInIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="6" fill="#0A66C2" />
      <path
        d="M6.94 5a2 2 0 11-4-.002A2 2 0 016.94 5zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z"
        fill="white"
      />
    </svg>
  );
}

export const PLATFORM_ICONS: Record<string, React.FC<IconProps>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  twitter: TwitterXIcon,
  facebook: FacebookIcon,
  telegram: TelegramIcon,
  snapchat: SnapchatIcon,
  threads: ThreadsIcon,
  soundcloud: SoundCloudIcon,
  spotify: SpotifyIcon,
  pinterest: PinterestIcon,
  linkedin: LinkedInIcon,
};

export function getPlatformIcon(slug: string) {
  return PLATFORM_ICONS[slug.toLowerCase()] ?? null;
}

export const PLATFORM_COLORS: Record<string, { bg: string; glow: string; text: string }> = {
  instagram: { bg: "from-pink-500 via-rose-500 to-purple-600", glow: "rgba(236,72,153,0.4)", text: "#E1306C" },
  tiktok: { bg: "from-gray-900 via-gray-800 to-gray-900", glow: "rgba(105,201,208,0.4)", text: "#010101" },
  youtube: { bg: "from-red-500 to-red-600", glow: "rgba(239,68,68,0.4)", text: "#FF0000" },
  twitter: { bg: "from-gray-900 to-gray-800", glow: "rgba(107,114,128,0.4)", text: "#000000" },
  facebook: { bg: "from-blue-600 to-blue-700", glow: "rgba(37,99,235,0.4)", text: "#1877F2" },
  telegram: { bg: "from-sky-400 to-blue-500", glow: "rgba(56,189,248,0.4)", text: "#229ED9" },
  snapchat: { bg: "from-yellow-300 to-yellow-400", glow: "rgba(250,204,21,0.4)", text: "#FFFC00" },
  threads: { bg: "from-gray-900 to-black", glow: "rgba(156,163,175,0.4)", text: "#000000" },
  soundcloud: { bg: "from-orange-500 to-orange-600", glow: "rgba(249,115,22,0.4)", text: "#FF5500" },
  spotify: { bg: "from-green-500 to-green-600", glow: "rgba(34,197,94,0.4)", text: "#1DB954" },
  pinterest: { bg: "from-red-600 to-rose-700", glow: "rgba(220,38,38,0.4)", text: "#E60023" },
  linkedin: { bg: "from-blue-700 to-blue-800", glow: "rgba(10,102,194,0.4)", text: "#0A66C2" },
};
