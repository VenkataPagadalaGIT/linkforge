/** The small "3D" and "NEW" labels after a Learn item's name, styled as in the Navbar. */
export default function LearnBadges({ badges, className = "text-[10px]" }: { badges?: string[]; className?: string }) {
  if (!badges?.length) return null;
  return (
    <>
      {badges.map((b) => (
        <span
          key={b}
          className={`ml-2 align-middle font-mono uppercase tracking-wider ${className} ${
            b === "3D" ? "text-sky-700/90 dark:text-sky-300/90" : "text-emerald-700/80 dark:text-emerald-300/80"
          }`}
        >
          {b}
        </span>
      ))}
    </>
  );
}
