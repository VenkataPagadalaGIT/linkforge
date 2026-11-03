/**
 * PersonaAvatar: a drawn figure for the selected demographic.
 *
 * Purpose is to make a data cell feel like a person. A row reading
 * "Women, 65 and over, n=2,758" is a statistic; a figure is someone you
 * picture, which is the entire point of a persona.
 *
 * Deliberate restraint in how it is drawn. Gender is shown by silhouette
 * and age by hair tone only, because those are the two dimensions the
 * source data actually publishes. No wrinkles, no stoop, no props, no
 * expressions: caricature would be both disrespectful and a claim the
 * data does not support. Faces carry eyes and nothing else, which is
 * enough to read as human without inventing a personality.
 *
 * Unset dimensions render a neutral figure rather than defaulting to a
 * man, so an unspecified audience never silently becomes a male one.
 */

export type AvatarGender = "men" | "women" | undefined;
export type AvatarAge = "teen" | "18-29" | "30-49" | "50-64" | "65+" | undefined;

/** Hair tone darkens through midlife and silvers with age. */
function hairTone(age: AvatarAge): string {
  switch (age) {
    case "teen":
    case "18-29":
      return "#3f3a36";
    case "30-49":
      return "#4a433d";
    case "50-64":
      return "#8d8880";
    case "65+":
      return "#cfcbc5";
    default:
      return "#5c5650";
  }
}

/** Younger figures are drawn very slightly smaller in the frame. */
function scaleFor(age: AvatarAge): number {
  return age === "teen" ? 0.94 : 1;
}

export default function PersonaAvatar({
  gender,
  age,
  size = 96,
  accent = "currentColor",
}: {
  gender?: AvatarGender;
  age?: AvatarAge;
  size?: number;
  accent?: string;
}) {
  const hair = hairTone(age);
  const s = scaleFor(age);
  const skin = "#c9a68a";
  const shirt = accent;

  const label = `${gender === "men" ? "Man" : gender === "women" ? "Woman" : "Person"}${
    age ? `, ages ${age === "teen" ? "13 to 17" : age}` : ""
  }`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        <clipPath id={`clip-${gender ?? "n"}-${age ?? "n"}`}>
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      {/* Frame */}
      <circle cx="60" cy="60" r="56" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.55" />

      <g clipPath={`url(#clip-${gender ?? "n"}-${age ?? "n"})`}>
        <g transform={`translate(60 62) scale(${s}) translate(-60 -62)`}>
          {/* Shoulders */}
          <path
            d="M22 122c0-21 17-33 38-33s38 12 38 33z"
            fill={shirt}
            opacity="0.85"
          />
          {/* Collar */}
          <path d="M50 90l10 11 10-11" fill="none" stroke={hair} strokeWidth="1.2" opacity="0.35" />

          {/* Neck */}
          <rect x="53" y="76" width="14" height="16" rx="6" fill={skin} />

          {/* Longer hair sits behind the head for the women silhouette */}
          {gender === "women" && (
            <path
              d="M32 58c0-19 12-31 28-31s28 12 28 31c0 14-2 24-4 32-3-10-3-20-4-27-6 5-13 7-20 7s-14-2-20-7c-1 7-1 17-4 27-2-8-4-18-4-32z"
              fill={hair}
            />
          )}

          {/* Head */}
          <ellipse cx="60" cy="55" rx="21" ry="24" fill={skin} />

          {/* Ears */}
          <circle cx="39" cy="56" r="4" fill={skin} />
          <circle cx="81" cy="56" r="4" fill={skin} />

          {/* Hair top, varying by silhouette */}
          {gender === "men" ? (
            <path d="M39 50c0-14 9-22 21-22s21 8 21 22c-4-8-11-11-21-11s-17 3-21 11z" fill={hair} />
          ) : gender === "women" ? (
            <path d="M38 52c0-16 10-25 22-25s22 9 22 25c-5-11-12-15-22-15s-17 4-22 15z" fill={hair} />
          ) : (
            <path d="M39 51c0-15 9-23 21-23s21 8 21 23c-4-9-11-13-21-13s-17 4-21 13z" fill={hair} />
          )}

          {/* Eyes. The only feature drawn. */}
          <circle cx="52" cy="56" r="2.1" fill="#2a2724" />
          <circle cx="68" cy="56" r="2.1" fill="#2a2724" />
        </g>
      </g>
    </svg>
  );
}
