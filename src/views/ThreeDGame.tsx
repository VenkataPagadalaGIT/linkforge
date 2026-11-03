"use client";
/**
 * The 3D Game view: the year-2040 city scene running in playable mode. The
 * humanoid is yours from the first frame; every vehicle, barge and semi in
 * the scene can be taken over by clicking it.
 */
import FutureCitySceneLazy from "@/components/future/FutureCitySceneLazy";

const CONTROLS: { keys: string; what: string }[] = [
  { keys: "Arrows / WASD", what: "Walk the humanoid" },
  { keys: "Shift", what: "Run" },
  { keys: "E", what: "Greet the nearest unit, it waves back" },
  { keys: "Click a machine", what: "Take the controls of any vehicle or barge" },
  { keys: "Wheel / R N D / pedals", what: "Steer, select gear, accelerate and brake" },
  { keys: "Esc", what: "Leave the machine and hand it back to the city" },
];

export default function ThreeDGame() {
  return (
    <div className="bg-background">
      {/* The game IS the page: it fills the viewport under the fixed navbar, so
          the controls dock to the frame the player is actually looking at. */}
      <div className="relative w-full h-[calc(100vh-4rem)] mt-16 border-b border-border overflow-hidden">
        {/* audio is opt-in and this is the only mount that takes it. The
            component library mounts the same scene as a demo tile, and a
            catalog page has no business making engine noise. */}
        <FutureCitySceneLazy game audio />
        <div className="pointer-events-none absolute top-5 left-6 z-20">
          <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase mb-1">
            Interactive · year 2040
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow leading-none">
            3D Game
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14">
        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 max-w-3xl">
          A city that runs itself, and you can interrupt it. Walk the humanoid,
          greet the crew, or climb into anything with wheels or a hull. The
          machines yield to you, the traffic waits, and the work carries on
          when you let go.
        </p>

        <h2 className="font-display text-2xl font-bold text-foreground mb-4">Controls</h2>
        <div className="border border-border divide-y divide-border/60 mb-10">
          {CONTROLS.map((c) => (
            <div key={c.keys} className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 p-4">
              <p className="font-mono text-xs text-foreground">{c.keys}</p>
              <p className="font-mono text-xs text-muted-foreground">{c.what}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold text-foreground mb-4">What is running under it</h2>
        <div className="space-y-3 mb-10">
          {[
            "Every machine follows an arc-length curve, so traffic keeps its spacing forever instead of drifting into a pile-up on a long session.",
            "Collision is a circle registry: bodies slide out of overlaps and bleed speed on contact, and the traffic yields when you park in its lane.",
            "The construction crew is coupled to its work. The kneeling pair's hands track the beam's real height each frame, a carrier hauls panels, a welder throws sparks.",
            "Nothing is downloaded. Every robot, truck, barge and tower is generated geometry, so the whole city ships as code.",
          ].map((t) => (
            <p key={t} className="font-mono text-xs text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-foreground/40">·</span>
              <span>{t}</span>
            </p>
          ))}
        </div>

        <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
          Needs WebGL. On a machine without it the scene degrades to a still
          frame rather than a blank box.
        </p>
      </div>
    </div>
  );
}
