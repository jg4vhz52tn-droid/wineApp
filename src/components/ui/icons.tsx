// Small stroke icon set, drawn for this app (24px grid, currentColor).
type IconProps = React.SVGProps<SVGSVGElement>;

function Svg(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export const GlassIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h10l-.6 5.2a4.4 4.4 0 0 1-8.8 0z" />
    <path d="M12 12.6V20M8.5 20.5h7" />
  </Svg>
);

export const CellarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.6" />
    <circle cx="15.5" cy="9" r="1.6" />
    <circle cx="8.5" cy="15" r="1.6" />
    <circle cx="15.5" cy="15" r="1.6" />
  </Svg>
);

export const LearnIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </Svg>
);

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);

export function GoogleIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...p}>
      <path
        fill="#4285F4"
        d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.2a11 11 0 0 0 0 9.9z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"
      />
    </svg>
  );
}

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
    <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
  </Svg>
);

export const RouteIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
  </Svg>
);

// --- senses, badges, actions ---------------------------------------------------

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.2" />
    <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

/** A nose seen from the front: bridge, tip and nostrils. */
export const NoseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 3.5c0 4.2-2.2 6.8-3.4 9.6-1 2.6.6 5.1 3.4 5.1h4c2.8 0 4.4-2.5 3.4-5.1C16.2 10.3 14 7.7 14 3.5" />
    <path d="M9.2 15.9c.7-1 1.8-1.1 2.8-.2 1-.9 2.1-.8 2.8.2" />
  </Svg>
);

/** Lips with a drop - the palate. */
export const PalateIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 13.5c2.2-2.6 4.3-3.6 6-3.1.9.3 1.9.9 3 .9s2.1-.6 3-.9c1.7-.5 3.8.5 6 3.1-2.6 3.3-5.6 5-9 5s-6.4-1.7-9-5Z" />
    <path d="M3 13.5c3 .8 6 1.2 9 1.2s6-.4 9-1.2" />
    <path d="M12 2.8c1.3 1.6 2 2.7 2 3.6a2 2 0 0 1-4 0c0-.9.7-2 2-3.6Z" />
  </Svg>
);

export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="13" r="3.4" />
  </Svg>
);

export const BulbIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 17.5h6M10 20.5h4" />
    <path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.7.5 1.2 1.3 1.2 2.2v1.8h4v-1.8c0-.9.5-1.7 1.2-2.2A5.5 5.5 0 0 0 12 3.5Z" />
  </Svg>
);

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.5c-2-1.6-4.6-2-8-1.5v13c3.4-.5 6 0 8 1.5 2-1.5 4.6-2 8-1.5V5c-3.4-.5-6-.1-8 1.5Z" />
    <path d="M12 6.5v13" />
  </Svg>
);

export const BlossomIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 9.8c-1.6-2-1.6-4.3 0-6.3 1.6 2 1.6 4.3 0 6.3ZM14.1 11.3c1.3-2.2 3.4-3.2 5.8-2.9-.7 2.4-2.6 3.8-5.1 4ZM13.3 13.9c2.5.6 4 2.4 4.2 4.9-2.5.2-4.4-1.1-5.1-3.5ZM10.7 13.9c-.7 2.4-2.6 3.7-5.1 3.5.2-2.5 1.7-4.3 4.2-4.9ZM9.9 11.3c-2.5-.2-4.4-1.6-5.1-4 2.4-.3 4.5.7 5.8 2.9Z" />
  </Svg>
);

/** A citrus slice - for acidity. */
export const CitrusIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="6" />
    <path d="M12 6v12M6 12h12M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4" />
  </Svg>
);

export const TimerIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 13.5V9.5M10 3h4M18 7l1.5-1.5" />
  </Svg>
);

export const HouseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11 12 4.5l8 6.5" />
    <path d="M6 9.5V19.5h12V9.5" />
    <path d="M10 19.5v-5h4v5" />
  </Svg>
);

/** A flag on a mast - for finding the pirate. */
export const FlagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 21V3.5" />
    <path d="M5.5 4.5h12l-2.5 4 2.5 4h-12" />
    <path d="M10 7.5l2.5 2.5M12.5 7.5 10 10" />
  </Svg>
);

export const GlobeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.5 3.6 5.3 3.6 8.5s-1.2 6-3.6 8.5c-2.4-2.5-3.6-5.3-3.6-8.5s1.2-6 3.6-8.5Z" />
  </Svg>
);
