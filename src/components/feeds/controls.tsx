"use client";
/**
 * The controls the feeds share: the dial, the tuner strip, list rows, hardware switches, the swipe card and the clicks.
 * News and Learn use the same parts, so a reader who learns one panel knows the other.
 */
import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronDown, Layers, Rows3, Search } from "lucide-react";

export const store = {
  get(k: string): string[] {
    try {
      return JSON.parse(window.localStorage.getItem(k) || "[]");
    } catch {
      return [];
    }
  },
  set(k: string, v: string[]) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode: likes and saves last for this visit only */
    }
  },
};

export function useWide() {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

/** News or Learn: two feeds, never mixed in one stream, because a course between breaking posts is the randomness this exists to avoid. */
export function ModeTabs({ mode }: { mode: "news" | "learn" | "search" }) {
  const cls = (on: boolean) => `rounded-full px-3 py-1.5 transition ${on ? "bg-white text-black" : "text-white/80 hover:text-white"}`;
  return (
    <nav aria-label="Feeds" className="flex shrink-0 rounded-full bg-white/10 p-0.5 text-[13px] font-bold backdrop-blur">
      <a href="/feeds" aria-current={mode === "news" ? "page" : undefined} className={cls(mode === "news")}>News</a>
      <a href="/feeds/learn" aria-current={mode === "learn" ? "page" : undefined} className={cls(mode === "learn")}>Learn</a>
    </nav>
  );
}

/** Feed or Swipe, as two icons so the top bar still fits a small phone. */
export function ViewToggle({ view, onChange }: { view: "scroll" | "swipe"; onChange: (v: "scroll" | "swipe") => void }) {
  const items = [
    { id: "scroll" as const, label: "Feed: scroll up", Icon: Rows3 },
    { id: "swipe" as const, label: "Swipe: cards", Icon: Layers },
  ];
  return (
    <div role="group" aria-label="View" className="flex shrink-0 rounded-full bg-white/10 p-0.5 backdrop-blur">
      {items.map(({ id, label, Icon }) => (
        <button key={id} type="button" aria-pressed={view === id} aria-label={label} title={label} onClick={() => { if (id !== view) onChange(id); }} className={`grid h-8 w-8 place-items-center rounded-full transition ${view === id ? "bg-white text-black" : "text-white/80 hover:text-white"}`}>
          <Icon size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/**
 * Detent clicks for the dial and the tuner, made in the browser (Web Audio), like a car's volume knob: a short
 * filtered tick per step, a softer bell when a topic is picked, a dull stop at either end. A light buzz on phones that
 * vibrate. Off when sound is off; silent, never broken, where audio is unavailable.
 */
export function useClicks(on: boolean) {
  const ctx = React.useRef<AudioContext | null>(null);
  const buf = React.useRef<AudioBuffer | null>(null);
  return React.useCallback(
    (kind: "tick" | "pick" | "stop") => {
      if (!on || typeof window === "undefined") return;
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const c = (ctx.current ??= new AC());
        if (c.state === "suspended") void c.resume();
        if (!buf.current) {
          const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.025), c.sampleRate);
          const d = b.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 5);
          buf.current = b;
        }
        const t = c.currentTime;
        const src = c.createBufferSource();
        src.buffer = buf.current;
        const f = c.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = kind === "stop" ? 700 : kind === "pick" ? 2200 : 3400;
        f.Q.value = kind === "stop" ? 0.8 : 1.6;
        const g = c.createGain();
        g.gain.value = kind === "stop" ? 0.7 : 0.45;
        src.connect(f);
        f.connect(g);
        g.connect(c.destination);
        src.start(t);
        if (kind === "pick") {
          const o = c.createOscillator();
          const og = c.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(660, t);
          o.frequency.exponentialRampToValueAtTime(990, t + 0.07);
          og.gain.setValueAtTime(0.0001, t);
          og.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
          og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          o.connect(og);
          og.connect(c.destination);
          o.start(t);
          o.stop(t + 0.16);
        }
        navigator.vibrate?.(kind === "stop" ? 14 : 5);
      } catch {
        /* no audio here: the controls still work, silently */
      }
    },
    [on]
  );
}

export type Station = { id: string; label: string; count: number; seen?: number };
export type Click = (k: "tick" | "pick" | "stop") => void;

/** The phone's topic control: a radio tuner across the top. Drag it, it ticks past each topic; let go to tune. */
export function TopicTuner({ items, index, onPick, click, onEdit, editLabel = "+ More", label = "Drag to focus the feed" }: { items: Station[]; index: number; onPick: (i: number) => void; click: Click; onEdit?: () => void; editLabel?: string; label?: string }) {
  const SP = 112;
  const [pos, setPos] = React.useState<number | null>(null);
  const drag = React.useRef<{ x: number; i: number; last: number; moved: boolean; id: number } | null>(null);
  const shown = pos ?? index;
  const clampI = (v: number) => Math.max(0, Math.min(items.length - 1, v));
  return (
    <div
      className="relative h-11 touch-none select-none overflow-hidden"
      data-no-tap
      role="group"
      aria-label={label}
      onPointerDown={(ev) => (drag.current = { x: ev.clientX, i: index, last: index, moved: false, id: ev.pointerId })}
      onPointerMove={(ev) => {
        const d = drag.current;
        if (!d) return;
        const dx = ev.clientX - d.x;
        if (!d.moved && Math.abs(dx) > 6) {
          d.moved = true;
          // capture only once it is a drag, so a plain tap still reaches the topic under the finger
          (ev.currentTarget as HTMLElement).setPointerCapture(d.id);
        }
        if (!d.moved) return;
        const raw = d.i - dx / SP;
        const f = clampI(raw);
        setPos(f);
        const r = Math.round(f);
        if (r !== d.last) {
          d.last = r;
          click("tick");
        }
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (!d?.moved) return;
        const r = Math.round(pos ?? index);
        setPos(null);
        if (r !== index) {
          click("pick");
          onPick(r);
        } else click("stop");
      }}
      onPointerCancel={() => {
        drag.current = null;
        setPos(null);
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 14px)" }} aria-hidden="true" />
      <div className={`absolute left-1/2 top-0 flex h-full ${pos === null ? "transition-transform duration-300 ease-out" : ""}`} style={{ transform: `translateX(${-(shown * SP + SP / 2)}px)` }}>
        {items.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (i === index) return;
              click("pick");
              onPick(i);
            }}
            aria-pressed={i === index}
            className={`flex h-full shrink-0 flex-col items-center justify-center px-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${i === index ? "text-white" : "text-white/60"}`}
            style={{ width: SP }}
          >
            <span className="max-w-full truncate">{t.label}</span>
            <span className="text-[9px] font-semibold normal-case tracking-normal text-white/65">{t.seen ? `${t.seen}/${t.count} seen` : t.count}</span>
          </button>
        ))}
        {onEdit && (
          <button type="button" onClick={onEdit} className="flex h-full shrink-0 items-center justify-center px-1 text-[12px] font-bold uppercase tracking-wider text-[#ef4444]" style={{ width: SP }}>
            {editLabel}
          </button>
        )}
      </div>
      <span className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-0.5 -translate-x-1/2 rounded bg-[#ef4444]" aria-hidden="true" />
      <span className="pointer-events-none absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#ef4444]" aria-hidden="true" />
    </div>
  );
}

/**
 * One row of the Topics or Platforms list: a checkbox, the name, how many posts (or how many seen), and "Only" to keep
 * just this one. Rows are 40px tall for fingers; "Only" is always visible on touch screens and below lg, on hover above.
 */
export function ToggleRow({ checked, label, icon, count, seen, focused, dim, onToggle, onOnly }: { checked: boolean; label: string; icon?: React.ReactNode; count: number; seen?: number; focused?: boolean; dim?: boolean; onToggle: () => void; onOnly: () => void }) {
  return (
    <li className={`group flex items-center gap-1 rounded-lg pr-1 transition-[background,opacity] hover:bg-white/[0.06] ${focused ? "bg-white/[0.08]" : ""} ${dim ? "opacity-[0.45]" : ""}`}>
      <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle} className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2.5 px-2 text-left">
        <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors ${checked ? "border-white bg-white text-black" : "border-white/35 text-transparent"}`} aria-hidden="true">
          <Check size={12} strokeWidth={3.5} />
        </span>
        {icon}
        <span className={`min-w-0 text-[14px] leading-tight ${checked ? "font-medium text-white" : "text-white/60"}`}>{label}</span>
        {focused && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef4444]" role="img" aria-label="the dial is on this one" />}
      </button>
      <button type="button" onClick={onOnly} aria-label={`Only ${label}`} className="shrink-0 rounded-md px-1.5 py-1.5 text-[11px] font-semibold text-white/65 transition hover:bg-white/10 hover:text-white lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        Only
      </button>
      <span className="w-[52px] shrink-0 text-right text-[12px] tabular-nums text-white/60">{seen ? `${seen}/${count}` : count}</span>
    </li>
  );
}

/**
 * A physical on/off switch for a platform, after the hardware toggles the owner pointed to: a recessed track that fills
 * with the site's red when on, and a brushed-metal thumb (a conic gradient catches the light like machined aluminium).
 */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-[3px] transition-[background,box-shadow] duration-200"
      style={{
        background: on ? "linear-gradient(180deg, #f05252 0%, #c81e1e 100%)" : "linear-gradient(180deg, #0f0f12 0%, #1c1c21 100%)",
        boxShadow: on ? "inset 0 1px 2px rgba(0,0,0,0.35), 0 0 0 1px rgba(239,68,68,0.45)" : "inset 0 2px 4px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <span
        className="h-5 w-5 rounded-full transition-transform duration-200 ease-out"
        style={{
          transform: on ? "translateX(20px)" : "translateX(0)",
          background: "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0) 42%), conic-gradient(from 20deg, #c9cad1, #f7f7f9, #b4b5bd, #ededf0, #bfc0c8, #f4f4f6, #c9cad1)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(0,0,0,0.25)",
        }}
      />
    </span>
  );
}

/** A platform row: the whole row toggles, the switch is the control screen readers hear, "Only" keeps just this one. */
export function SwitchRow({ id, on, label, icon, count, onToggle, onOnly }: { id: string; on: boolean; label: string; icon?: React.ReactNode; count?: number; onToggle: () => void; onOnly?: () => void }) {
  return (
    <li className="group flex items-center gap-1 rounded-lg pl-2 pr-0.5 transition-colors hover:bg-white/[0.06]">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onToggle} className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 text-left">
        {icon}
        <span id={id} className={`min-w-0 text-[14px] leading-tight ${on ? "font-medium text-white" : "text-white/60"}`}>{label}</span>
      </button>
      {onOnly && (
        <button type="button" onClick={onOnly} aria-label={`Only ${label}`} className="shrink-0 rounded-md px-1.5 py-1.5 text-[11px] font-semibold text-white/65 transition hover:bg-white/10 hover:text-white lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          Only
        </button>
      )}
      {count !== undefined && <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-white/60">{count}</span>}
      <button type="button" role="switch" aria-checked={on} aria-labelledby={id} onClick={onToggle} className="grid min-h-[44px] shrink-0 place-items-center rounded-full px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40">
        <Switch on={on} />
      </button>
    </li>
  );
}

/** A section of the Tune panel: a title, what is on right now, and a fold, so the panel can be short when someone wants it short. */
export function PanelSection({ id, title, hint, summary, defaultOpen = true, children }: { id: string; title: string; hint?: string; summary?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="px-2">
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)} className="flex min-h-[32px] w-full items-center gap-1.5 text-left">
          <ChevronDown size={14} className={`shrink-0 text-white/50 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-white/65">{title}</span>
          {hint && <span className="min-w-0 truncate text-[11px] text-white/45">{hint}</span>}
          {summary !== undefined && <span className="ml-auto shrink-0 text-[11px] text-white/55">{summary}</span>}
        </button>
      </h3>
      {open && <div id={`${id}-body`} className="mt-1">{children}</div>}
    </section>
  );
}

/** Swipe view's top card: drag right to like, left to skip, as on a dating app; tap to read. */
export function SwipeTop({ children, canDrag, onSwipe, onTap, dir }: { children: React.ReactNode; canDrag: boolean; onSwipe: (d: 1 | -1) => void; onTap: () => void; dir: number }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-16, 16]);
  const likeO = useTransform(x, [24, 140], [0, 1]);
  const skipO = useTransform(x, [-140, -24], [1, 0]);
  const down = React.useRef<{ x: number; y: number } | null>(null);
  return (
    <motion.div
      custom={dir}
      variants={{ exit: (d: number) => ({ x: d * 560, rotate: d * 20, opacity: 0, transition: { duration: 0.3 } }) }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit="exit"
      drag={canDrag ? "x" : false}
      dragSnapToOrigin
      onDragEnd={(_, info) => {
        if (info.offset.x > 120 || info.velocity.x > 700) onSwipe(1);
        else if (info.offset.x < -120 || info.velocity.x < -700) onSwipe(-1);
      }}
      onPointerDown={(ev) => {
        down.current = (ev.target as HTMLElement).closest("button,a,iframe,[data-no-tap]") ? null : { x: ev.clientX, y: ev.clientY };
      }}
      onPointerUp={(ev) => {
        const d = down.current;
        down.current = null;
        if (d && Math.abs(ev.clientX - d.x) < 8 && Math.abs(ev.clientY - d.y) < 8) onTap();
      }}
      style={{ x, rotate }}
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[28px] bg-black shadow-2xl ring-1 ring-white/10 active:cursor-grabbing"
    >
      {children}
      <motion.span style={{ opacity: likeO }} className="pointer-events-none absolute left-5 top-6 z-30 -rotate-12 rounded-lg border-4 border-[#22c55e] px-3 py-0.5 font-display text-3xl font-black text-[#22c55e]">LIKE</motion.span>
      <motion.span style={{ opacity: skipO }} className="pointer-events-none absolute right-5 top-6 z-30 rotate-12 rounded-lg border-4 border-white/80 px-3 py-0.5 font-display text-3xl font-black text-white/90">SKIP</motion.span>
    </motion.div>
  );
}

export function Chip({ on, onClick, children, count }: { on: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${on ? "bg-white text-black" : "bg-white/10 text-white/80 hover:bg-white/15"}`}>
      {children}
      {count !== undefined && <span className={`text-[11px] ${on ? "text-black/55" : "text-white/45"}`}>{count}</span>}
    </button>
  );
}

/**
 * Pick where things come from: one, four, or all. With hundreds of platforms a list of switches is useless, so it is a
 * search box over a short list, biggest first. Nothing picked means all of them.
 */
export function PlatformPicker({ id, items, selected, onChange, click, allLabel = "All platforms", searchLabel = "Search platforms", icon }: { id: string; items: { id: string; label: string; count: number }[]; selected: string[]; onChange: (ids: string[]) => void; click: Click; allLabel?: string; searchLabel?: string; icon?: (id: string) => React.ReactNode }) {
  const [q, setQ] = React.useState("");
  const [all, setAll] = React.useState(false);
  const TOP = 6;
  const needle = q.trim().toLowerCase();
  const sorted = [...items].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const matches = needle ? sorted.filter((x) => x.label.toLowerCase().includes(needle)) : sorted;
  const shown = needle || all ? matches : matches.filter((x, i) => i < TOP || selected.includes(x.id));
  const total = items.reduce((n, x) => n + x.count, 0);
  const toggle = (x: string) => {
    click("tick");
    onChange(selected.includes(x) ? selected.filter((y) => y !== x) : [...selected, x]);
  };
  const row = "flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-2 text-left text-[14px] transition-colors hover:bg-white/[0.06]";
  const box = (on: boolean) => `grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors ${on ? "border-white bg-white text-black" : "border-white/35 text-transparent"}`;
  return (
    <div>
      {items.length > TOP && (
        <label className="mx-2 mb-1 flex min-h-[38px] items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 focus-within:ring-2 focus-within:ring-white/25">
          <Search size={14} className="shrink-0 text-white/55" aria-hidden="true" />
          <span className="sr-only">{searchLabel}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchLabel} className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/50" autoComplete="off" />
        </label>
      )}
      <ul>
        {!needle && (
          <li>
            <button type="button" role="checkbox" aria-checked={!selected.length} onClick={() => { click("tick"); onChange([]); }} className={row}>
              <span className={box(!selected.length)} aria-hidden="true"><Check size={12} strokeWidth={3.5} /></span>
              <span className={`min-w-0 flex-1 ${!selected.length ? "font-medium text-white" : "text-white/70"}`}>{allLabel}</span>
              <span className="shrink-0 text-[12px] tabular-nums text-white/60">{total}</span>
            </button>
          </li>
        )}
        {shown.map((x) => {
          const on = selected.includes(x.id);
          return (
            <li key={x.id}>
              <button type="button" role="checkbox" aria-checked={on} id={`${id}-${x.id}`} onClick={() => toggle(x.id)} className={row}>
                <span className={box(on)} aria-hidden="true"><Check size={12} strokeWidth={3.5} /></span>
                {icon?.(x.id)}
                <span className={`min-w-0 flex-1 leading-tight ${on ? "font-medium text-white" : "text-white/80"}`}>{x.label}</span>
                <span className="shrink-0 text-[12px] tabular-nums text-white/60">{x.count}</span>
              </button>
            </li>
          );
        })}
        {needle && !matches.length && <li className="px-2 py-2 text-[13px] text-white/65">No platform called &ldquo;{q.trim()}&rdquo;.</li>}
      </ul>
      {!needle && items.length > TOP && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-0.5 min-h-[36px] px-2 text-[13px] font-semibold text-white/75 hover:text-white">
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}

const POSTER_TONES = [
  ["#7f1d1d", "#ef4444"], ["#1e3a8a", "#3b82f6"], ["#134e4a", "#14b8a6"], ["#581c87", "#a855f7"], ["#78350f", "#f59e0b"], ["#831843", "#ec4899"], ["#14532d", "#22c55e"], ["#0c4a6e", "#06b6d4"],
];
const hashOf = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * A cover for a resource whose page offers no picture, so no post is ever a blank screen: a book looks like a book, a
 * paper like a first page, a course or guide like a lesson card. Its colours come from its title, so each one differs.
 */
export function Poster({ title, creator, format, platform }: { title: string; creator?: string; format?: string; platform?: string }) {
  const [deep, bright] = POSTER_TONES[hashOf(title) % POSTER_TONES.length];
  const clean = title.split(" · ")[0];
  if (format === "paper") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pb-[var(--kgf-bottom)] pt-[var(--kgf-top)]" style={{ background: `radial-gradient(90% 70% at 50% 40%, ${deep}, #07080c)` }}>
        <div className="w-[62%] max-w-[300px] -rotate-2 rounded-sm bg-[#faf9f5] p-5 text-black shadow-2xl" style={{ aspectRatio: "3 / 4" }}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/55">{platform || "Paper"}</p>
          <p className="mt-2 line-clamp-5 font-serif text-[19px] font-bold leading-[1.15]">{clean}</p>
          <p className="mt-2 line-clamp-1 font-serif text-[11px] italic text-black/65">{creator}</p>
          <div className="mt-3 space-y-1.5" aria-hidden="true">
            {[100, 94, 98, 88, 96, 70].map((w, i) => <span key={i} className="block h-[3px] rounded bg-black/15" style={{ width: `${w}%` }} />)}
          </div>
        </div>
      </div>
    );
  }
  if (format === "book") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pb-[var(--kgf-bottom)] pt-[var(--kgf-top)]" style={{ background: `radial-gradient(90% 70% at 50% 40%, ${deep}, #07080c)` }}>
        <div className="relative w-[58%] max-w-[280px] rotate-1 overflow-hidden rounded-r-lg rounded-l-sm p-5 pl-7 text-white shadow-2xl" style={{ aspectRatio: "2 / 3", background: `linear-gradient(150deg, ${bright}, ${deep})` }}>
          <span className="absolute inset-y-0 left-0 w-3 bg-black/25" aria-hidden="true" />
          <p className="line-clamp-6 font-display text-[23px] font-black leading-[1.1]">{clean}</p>
          <p className="absolute bottom-4 left-7 right-4 line-clamp-2 text-[12px] font-semibold text-white/85">{creator}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-5 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)]" style={{ background: `radial-gradient(90% 70% at 30% 20%, ${bright}55, transparent), radial-gradient(90% 70% at 90% 90%, ${deep}, #07080c)` }}>
      <span className="pointer-events-none absolute -right-6 top-1/4 select-none font-display text-[150px] font-black leading-none text-white/[0.07]" aria-hidden="true">{(platform || clean).slice(0, 2)}</span>
      <div className="relative w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/15 bg-black/35 p-5 shadow-2xl backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: bright }}>{platform || format}</p>
        <p className="mt-2 line-clamp-5 font-display text-[24px] font-black leading-[1.12] text-white">{clean}</p>
        {creator && creator !== platform && <p className="mt-2 line-clamp-1 text-[13px] text-white/80">{creator}</p>}
      </div>
    </div>
  );
}

/** Days in a row with some learning done. A reason to come back that serves the reader. */
export function useStreak(): number {
  const [days, setDays] = React.useState(0);
  React.useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const s = JSON.parse(window.localStorage.getItem("kgf:streak") || "null") as { last: string; days: number } | null;
      const next = !s ? 1 : s.last === today ? s.days : s.last === yesterday ? s.days + 1 : 1;
      window.localStorage.setItem("kgf:streak", JSON.stringify({ last: today, days: next }));
      setDays(next);
    } catch {
      /* private mode: no streak, nothing else changes */
    }
  }, []);
  return days;
}

/** The moment a topic is finished. */
export function Celebrate({ title, sub, onDone }: { title: string; sub: string; onDone: () => void }) {
  const dots = React.useMemo(() => Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * Math.PI * 2, r: 90 + (i % 5) * 26, c: POSTER_TONES[i % POSTER_TONES.length][1] })), []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onAnimationComplete={() => window.setTimeout(onDone, 1500)} className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" role="status">
      {dots.map((d, i) => (
        <motion.span key={i} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(d.a) * d.r, y: Math.sin(d.a) * d.r, opacity: 0, scale: 0.4 }} transition={{ duration: 1.3, ease: "easeOut" }} className="absolute h-2.5 w-2.5 rounded-full" style={{ background: d.c }} aria-hidden="true" />
      ))}
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 240 }} className="max-w-[80%] rounded-3xl bg-white px-6 py-4 text-center text-black shadow-2xl">
        <p className="font-display text-xl font-black">{title}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-black/70">{sub}</p>
      </motion.div>
    </motion.div>
  );
}
