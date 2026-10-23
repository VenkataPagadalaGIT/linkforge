/**
 * hvac.ts — the HVAC fault ontology behind the 3D troubleshooter.
 *
 * Three node types — Component, Symptom, Fault — connected by edges:
 * Fault→implicates→Component and Fault→presentsAs→Symptom. The 3D scene
 * renders Components, the diagnose panel selects Symptoms, and rankFaults()
 * traverses the edges to score candidate Faults. Data-only module: it is
 * imported by the prerender plugin, so no React/DOM/three imports here.
 */

export type HvacZone = "outdoor" | "indoor" | "distribution" | "control";
export type Severity = "diy" | "pro" | "urgent";

/**
 * The five paths every HVAC failure lives on. Paths are the ontology's
 * top-level segmentation: each component belongs to one, faults inherit
 * paths from their components, and the UI colors everything by them.
 */
export type HvacPath = "airflow" | "refrigerant" | "electrical" | "combustion" | "drainage";

export interface HvacPathMeta {
  label: string;
  color: string;
  /** What this path carries and why it exists. */
  description: string;
  /** The signature way this path fails. */
  failureSignature: string;
  /** Component ids in flow order — the story of the path. */
  flow: string[];
}

export const PATHS: Record<HvacPath, HvacPathMeta> = {
  airflow: {
    label: "Airflow path",
    color: "#60a5fa",
    description:
      "The air loop: room air returns through the ducts, gets filtered, is pushed by the blower across the coil (cooling) or heat exchanger (heating), and travels back out the supply ducts. Every BTU the system makes rides this path to reach you.",
    failureSignature:
      "Starvation. A clogged filter, dying blower, or crushed/leaky duct chokes the air — and the starved coil ices, the furnace overheats, and rooms go uneven. Most airflow fixes are DIY.",
    flow: ["ductwork", "air-filter", "blower", "heat-exchanger", "evaporator-coil", "flex-duct"],
  },
  refrigerant: {
    label: "Refrigerant path",
    color: "#fb923c",
    description:
      "The sealed heat conveyor: the compressor drives refrigerant through the condenser, liquid line, TXV, and evaporator coil, moving heat out of the house in summer (and into it, on a heat pump, in winter).",
    failureSignature:
      "Leaks and starvation. Low charge ices the coil and cooks the compressor; a blocked condenser or dead fan spikes pressure until the system trips. Everything on this path is licensed-pro territory (EPA 608).",
    flow: ["compressor", "refrigerant-pressure-switches", "reversing-valve", "condenser-coil", "condenser-fan", "service-valves", "refrigerant-lines", "txv", "evaporator-coil"],
  },
  electrical: {
    label: "Electrical & control path",
    color: "#facc15",
    description:
      "The chain of command: breaker and disconnect feed power; the thermostat and control board decide who runs; the contactor switches the outdoor unit; the capacitor kick-starts its motors; on heat pumps, the board also stages the auxiliary heat strips.",
    failureSignature:
      "Lies and dead switches. A dead capacitor hums, a welded contactor never shuts off, and a faulty sensor board silently latches 4–5x-cost emergency heat all winter. Cheap parts, expensive symptoms.",
    flow: ["breaker-disconnect", "service-wiring", "furnace-switch", "blower-door-switch", "transformer", "thermostat", "outdoor-air-sensor", "defrost-sensor", "control-board", "contactor", "capacitor", "aux-heat-strips"],
  },
  combustion: {
    label: "Combustion path",
    color: "#f87171",
    description:
      "The fire side of a gas furnace: igniter lights the burners, the flame sensor proves it, and the heat exchanger passes the heat to air while keeping exhaust sealed away from it.",
    failureSignature:
      "Ignition lockouts and — the one true emergency — a cracked heat exchanger leaking carbon monoxide. Flame-sensor cleaning is routine; anything else on this path is a pro call, and CO signs mean leave first.",
    flow: ["inducer-fan", "igniter", "gas-supply-shutoff", "gas-valve", "heat-exchanger", "limit-switch", "flue-vent-pipe", "furnace-condensate-trap"],
  },
  drainage: {
    label: "Drainage path",
    color: "#34d399",
    description:
      "The water exit: the cooling coil condenses gallons a day out of the air; the primary pan and drain line carry it out, the emergency pan underneath catches what the primary misses, and the float switch stands guard over both.",
    failureSignature:
      "Clogs. Algae blocks the line, water backs into the pans, and the float switch kills the whole system — the classic 'dead AC' that's actually a $0 fix. A dripping outdoor outlet is this path's health check.",
    flow: ["evaporator-coil", "condensate-drain", "drain-cleanout-tee", "condensate-pump", "emergency-pan", "float-switch"],
  },
};

export interface HvacComponent {
  id: string;
  name: string;
  zone: HvacZone;
  /** Primary system path this component lives on. */
  path: HvacPath;
  /** Additional paths this component participates in (e.g. the evaporator
   *  coil sits on refrigerant, airflow, and drainage). */
  secondaryPaths?: HvacPath[];
  /** What this part does, one sentence. */
  role: string;
  /** What it looks/sounds like when this part is the problem. */
  failureSigns: string;
}

export interface HvacSymptom {
  id: string;
  label: string;
  hint?: string;
  /** True = safety emergency: bypass ranking, show evacuate-first guidance. */
  emergency?: boolean;
}

export interface HvacFault {
  id: string;
  name: string;
  severity: Severity;
  /** Restricts a fault to one system type; undefined = applies to all. */
  appliesTo?: "gas" | "heatpump";
  /** Generic board-code families that report this fault (OEM-agnostic). */
  oemCodeHints?: string[];
  /** 1–10: how often this is the culprit on real service calls. */
  prior: number;
  components: string[];
  symptoms: string[];
  cause: string;
  checks: string[];
  fix: string;
  costHint: string;
}

/* ---------------------------------------------------------------- *
 *  Components (the parts the 3D scene renders)
 * ---------------------------------------------------------------- */

export const COMPONENTS: HvacComponent[] = [
  {
    id: "thermostat",
    name: "Thermostat",
    zone: "control",
    path: "electrical",
    role: "The brain: senses room temperature and tells the furnace, blower, and outdoor unit when to run.",
    failureSigns:
      "Blank screen, system ignoring the set temperature, or heating/cooling that never starts. Dead batteries and a mis-set heat/cool switch cause a surprising share of 'broken HVAC' calls.",
  },
  {
    id: "air-filter",
    name: "Air Filter",
    zone: "indoor",
    path: "airflow",
    role: "Strains dust out of return air before it reaches the blower and evaporator coil.",
    failureSigns:
      "Weak airflow at vents, a coil that ices over, longer run times, and rising bills. A filter you can't see light through is past due.",
  },
  {
    id: "blower",
    name: "Blower Motor & Wheel",
    zone: "indoor",
    path: "airflow",
    role: "Pulls air through the return and filter, pushes it across the coil and heat exchanger, and out the supply ducts.",
    failureSigns:
      "No airflow while the system 'runs', screeching or grinding at startup, humming with no spin, or a burning smell from the cabinet.",
  },
  {
    id: "heat-exchanger",
    name: "Burners & Heat Exchanger",
    zone: "indoor",
    path: "combustion",
    role: "Burns gas and transfers that heat to passing air while keeping combustion gases sealed away from it.",
    failureSigns:
      "Furnace shuts off on limit, a formaldehyde-like or metallic smell, soot streaks, or a CO alarm. A cracked heat exchanger is a shut-it-down-now problem.",
  },
  {
    id: "igniter",
    name: "Igniter & Flame Sensor",
    zone: "indoor",
    path: "combustion",
    role: "The igniter lights the burners; the flame sensor proves they lit so the gas valve can stay open.",
    failureSigns:
      "Clicking with no ignition, burners lighting then dying within seconds, or three-tries-then-lockout behavior.",
  },
  {
    id: "evaporator-coil",
    name: "Evaporator Coil (A-Coil)",
    zone: "indoor",
    path: "refrigerant",
    secondaryPaths: ["airflow", "drainage"],
    role: "Cold refrigerant inside this coil absorbs heat and moisture from indoor air blowing across it.",
    failureSigns:
      "Ice on the coil or lines, weak cooling with a running system, water overflowing the pan, or musty smells from a dirty coil.",
  },
  {
    id: "txv",
    name: "Metering Device (TXV)",
    zone: "indoor",
    path: "refrigerant",
    role: "Meters exactly how much liquid refrigerant enters the evaporator coil to match the cooling load.",
    failureSigns:
      "Coil icing at the inlet, poor cooling despite a correct refrigerant charge, and pressures a technician reads as 'starved coil'.",
  },
  {
    id: "condensate-drain",
    name: "Primary Pan & Drain Line",
    zone: "indoor",
    path: "drainage",
    role: "Catches the water the evaporator coil wrings out of the air and carries it outside (or to a pump) through a narrow PVC line.",
    failureSigns:
      "Water around the indoor unit, a drain outlet that stops dripping on humid days, or a musty smell from standing water. Algae clogs are the #1 drainage failure.",
  },
  {
    id: "emergency-pan",
    name: "Emergency Drain Pan",
    zone: "indoor",
    path: "drainage",
    role: "The wide shallow pan under the whole unit — the last line of defense for attic and closet installs. It should be bone dry; water here means the primary drain already failed.",
    failureSigns:
      "ANY standing water is a red flag: the primary pan or line is clogged or cracked and you're one pan-depth away from a ceiling stain. Rusted-through pans and crooked (non-level) pans quietly forfeit the protection.",
  },
  {
    id: "float-switch",
    name: "Float Switch",
    zone: "indoor",
    path: "drainage",
    role: "The water watchdog: a float on the pan or drain line that rises with backed-up water and opens the 24V circuit — shutting the whole system down before water reaches your ceiling.",
    failureSigns:
      "A system that plays completely dead in summer with no error anywhere — check for a tripped float before calling anyone. Also fails the other way: a stuck or bypassed switch that never trips, discovered via the ceiling.",
  },
  {
    id: "service-valves",
    name: "Service Valves & Gauge Ports",
    zone: "outdoor",
    path: "refrigerant",
    role: "The two brass valves where the copper lines enter the outdoor unit, each with a capped Schrader port (like a tire valve). This is where a technician's manifold gauges clip on for the pressure test — the refrigerant loop's only window.",
    failureSigns:
      "Slow refrigerant loss with no visible line damage — a leaking Schrader core or a missing brass cap is one of the most common leak-search findings. Oil staining at the valve bodies, hissing at a port, or a system that never cooled right because an installer left a valve stem partially closed. The homeowner check: both caps present and snug.",
  },
  {
    id: "refrigerant-lines",
    name: "Refrigerant Lines",
    zone: "distribution",
    path: "refrigerant",
    role: "Two copper lines loop refrigerant between indoor coil and outdoor unit: a fat insulated suction line and a thin liquid line.",
    failureSigns:
      "Ice or heavy frost on the lines, oil stains at joints (the classic leak tell), or hissing near a fitting.",
  },
  {
    id: "compressor",
    name: "Compressor",
    zone: "outdoor",
    path: "refrigerant",
    role: "The heart of the refrigeration loop: squeezes low-pressure vapor into hot high-pressure vapor so it can dump heat outdoors.",
    failureSigns:
      "Hard starting (lights dim, clunk), humming without starting, tripped breakers, or a dead outdoor unit with the fan still spinning.",
  },
  {
    id: "condenser-coil",
    name: "Condenser Coil",
    zone: "outdoor",
    path: "refrigerant",
    role: "Rejects the heat collected indoors: outdoor air blown through these fins carries it away as refrigerant condenses.",
    failureSigns:
      "Cottonwood- or dirt-matted fins, a unit that runs hot and long, high head pressure, and bills creeping up every summer.",
  },
  {
    id: "condenser-fan",
    name: "Condenser Fan",
    zone: "outdoor",
    path: "refrigerant",
    role: "Pulls outdoor air through the condenser coil so the refrigerant can dump its heat.",
    failureSigns:
      "Outdoor unit running with a still fan (top of unit very hot), blade wobble or screech, or a unit that trips off on high pressure within minutes.",
  },
  {
    id: "capacitor",
    name: "Run Capacitor",
    zone: "outdoor",
    path: "electrical",
    role: "Stores the electrical kick that gets the compressor and fan motors spinning and keeps them running efficiently.",
    failureSigns:
      "The #1 outdoor-unit failure: humming or clicking with nothing starting, a fan you can start by pushing with a stick, or a visibly bulged capacitor top.",
  },
  {
    id: "contactor",
    name: "Contactor",
    zone: "outdoor",
    path: "electrical",
    role: "The heavy-duty relay that connects high-voltage power to the outdoor unit when the thermostat calls.",
    failureSigns:
      "Loud chattering, an outdoor unit that never gets power, or the opposite — a unit that keeps running after the thermostat is satisfied (welded contacts).",
  },
  {
    id: "breaker-disconnect",
    name: "Breaker & Disconnect",
    zone: "control",
    path: "electrical",
    role: "The electrical supply: the breaker at the panel plus the pull-out disconnect box beside the outdoor unit.",
    failureSigns:
      "A completely dead system or dead outdoor unit. A breaker that re-trips immediately signals a real electrical fault — stop resetting it.",
  },
  {
    id: "furnace-switch",
    name: "Furnace Service Switch (SSU)",
    zone: "control",
    path: "electrical",
    role: "The light-switch-looking shutoff on or near the furnace — often in the garage or at the attic entrance — that cuts the furnace's 120V feed. Many hold a small cartridge fuse inside (an 'SSU': switch, service unit).",
    failureSigns:
      "The #1 'my furnace is completely dead' cause that isn't a breaker: someone flipped it thinking it was a light switch, a painter turned it off, or its internal fuse blew. If the system went dead after anyone worked near the furnace or garage — check this switch before anything else.",
  },
  {
    id: "limit-switch",
    name: "High-Limit & Rollout Switches",
    zone: "indoor",
    path: "combustion",
    role: "The furnace's overheat guards: the high-limit opens if the heat exchanger gets too hot (usually from weak airflow), and rollout switches trip if flames escape where they shouldn't.",
    failureSigns:
      "Heat that cuts off mid-cycle and restarts (limit tripping — think airflow: filter, blower, closed vents), or a furnace locked out until a rollout switch is manually reset. A tripped ROLLOUT is a red flag: that's flames leaving the burner box — pro visit, not a reset-and-forget.",
  },
  {
    id: "condensate-pump",
    name: "Condensate Pump",
    zone: "indoor",
    path: "drainage",
    role: "For basements and closets where the drain can't flow downhill: a small reservoir pump that lifts condensate up and out. Has its own float — and often its own safety wire into the 24V circuit.",
    failureSigns:
      "Water pooling around a small plastic box beside the furnace, a pump humming or rattling nonstop, or a dead system in summer when its safety float tripped. Algae sludge in the reservoir is the usual killer — it wants an annual rinse.",
  },
  {
    id: "reversing-valve",
    name: "Reversing Valve (Heat Pump)",
    zone: "outdoor",
    path: "refrigerant",
    role: "The heat-pump part that literally reverses the refrigerant loop — one solenoid slide decides whether the system moves heat out of the house (cooling) or into it (heating).",
    failureSigns:
      "A heat pump blowing cold on a heat call (or warm on a cool call), a loud 'whoosh' with no mode change, or a system stuck in one mode. A valve stuck mid-shift mimics low refrigerant — techs tell them apart by temperature-testing the four lines at the valve.",
  },
  {
    id: "blower-door-switch",
    name: "Blower Door Safety Switch",
    zone: "indoor",
    path: "electrical",
    role: "The plunger switch behind the blower compartment panel that cuts all power to the furnace the instant the door comes off — and only restores it when the panel is seated fully.",
    failureSigns:
      "Furnace plays completely dead right after a filter change or any panel removal; the system springs to life when you press the door panel inward. A switch found taped or zip-tied down is a dangerous bypass someone left behind, and a worn switch causes intermittent no-power that mimics a bad board.",
  },
  {
    id: "blower-run-capacitor",
    name: "Blower Run Capacitor (Indoor)",
    zone: "indoor",
    path: "electrical",
    role: "The indoor twin of the outdoor run capacitor: a small canister in the blower compartment that gives a PSC blower motor its starting kick and keeps it spinning efficiently.",
    failureSigns:
      "Blower hums but won't spin, airflow that starts normal then dies mid-cycle as the struggling motor overheats, or a bulged, oil-weeping canister top — all with breakers on and the thermostat calling. A $15 part that gets quoted as a $1,000 blower motor more often than it should.",
  },
  {
    id: "defrost-sensor",
    name: "Defrost / Coil Sensor (Heat Pump)",
    zone: "outdoor",
    path: "electrical",
    role: "A small thermistor clamped to the outdoor coil that tells the defrost board when the coil is icing and when a defrost cycle has finished.",
    failureSigns:
      "An outdoor unit encased in solid ice for days (never defrosts), steam-plume defrosts every few minutes, or the silent one: a lying sensor latches auxiliary heat on all winter and the 3–5x electric bill is the only symptom. Often it hasn't failed at all — it just slipped off its clamp on the coil tube.",
  },
  {
    id: "outdoor-air-sensor",
    name: "Outdoor Air Temperature Sensor",
    zone: "outdoor",
    path: "electrical",
    role: "An ambient thermistor at the outdoor unit (or feeding the thermostat) that reports outdoor temperature so the system can lock out expensive auxiliary heat above the balance point.",
    failureSigns:
      "AUX/EM HEAT engaging on mild 45°F+ days, a thermostat or board displaying an outdoor temperature wildly different from reality, or aux staging that never locks out. The fingerprint: a winter bill out of proportion to the weather while the house stays perfectly warm.",
  },
  {
    id: "refrigerant-pressure-switches",
    name: "High/Low-Pressure Switches",
    zone: "outdoor",
    path: "refrigerant",
    role: "Two safety switches on the refrigerant circuit: the high-pressure switch cuts the compressor before a blocked condenser bursts something; the low-pressure switch stops it from running itself to death on a leaked-out system.",
    failureSigns:
      "A unit that starts, runs minutes, and cuts out repeatedly on a hot day (high-pressure trips from a matted coil or dead fan), a heat pump locked out on a low-pressure code after a slow leak, or nuisance trips from a failing switch that impersonate a dying compressor.",
  },
  {
    id: "flue-vent-pipe",
    name: "Flue / Vent & Intake Piping",
    zone: "indoor",
    path: "combustion",
    role: "The exhaust pipe (metal B-vent on 80% furnaces, white PVC on high-efficiency ones, usually with a second PVC intake pipe) that carries combustion gases outside and brings combustion air in.",
    failureSigns:
      "Furnace locks out with a 'pressure switch stuck open' code after snow, ice, leaves, or a nest blocks the termination; sagging PVC joints pooling condensate; soot-stained metal vent; in the worst case, back-drafting and a CO alarm. Blocked terminations are the #1 winter no-heat cause a homeowner can safely fix.",
  },
  {
    id: "gas-supply-shutoff",
    name: "Gas Line, Shutoff & Drip Leg",
    zone: "indoor",
    path: "combustion",
    role: "The black-iron pipe feeding the furnace, the quarter-turn manual shutoff beside it (handle parallel to the pipe = open), and the short capped 'drip leg' that catches pipe debris before the gas valve.",
    failureSigns:
      "Igniter glows but no whoosh because someone closed the shutoff after other work — the zero-dollar fault that impersonates a $300–$700 gas valve replacement. A rotten-egg smell at fittings is a leave-the-house-now sign, not a troubleshooting step.",
  },
  {
    id: "furnace-condensate-trap",
    name: "Furnace Condensate Trap",
    zone: "indoor",
    path: "combustion",
    role: "On high-efficiency (90%+) furnaces, the small plastic trap and hoses that drain the acidic water the secondary heat exchanger wrings out of the exhaust — a condensing furnace makes water all winter, not just the AC in summer.",
    failureSigns:
      "Winter no-heat with pressure-switch lockout codes as backed-up water floods the inducer housing, gurgling at startup, or water under the furnace cabinet in heating season. The part that explains a wet furnace in January, when the AC condensate story can't.",
  },
  {
    id: "drain-cleanout-tee",
    name: "Drain Cleanout Tee",
    zone: "indoor",
    path: "drainage",
    role: "The capped T-fitting in the condensate drain line near the coil: pop the cap to pour vinegar in or vacuum a clog out, and it lets air in behind the trap so water flows instead of siphoning.",
    failureSigns:
      "A missing cap lets blower air blow down the drain and spit water at the tee; a glued-shut or absent tee turns a five-minute vinegar treatment into a cut-the-pipe service call. Water burping out of the open tee means the clog is downstream of it.",
  },
  {
    id: "inducer-fan",
    name: "Inducer / Draft Fan",
    zone: "indoor",
    path: "combustion",
    role: "The small fan that runs before ignition: it purges old gas from the heat exchanger and proves draft (via the pressure switch) so the board will allow the burners to light.",
    failureSigns:
      "A furnace that does nothing at all on a heat call (no pre-ignition whir), loud bearing whine at startup, or board codes for a stuck-open/closed pressure switch. No inducer proof = no ignition, ever.",
  },
  {
    id: "gas-valve",
    name: "Gas Valve",
    zone: "indoor",
    path: "combustion",
    role: "The 24V-controlled valve that meters gas to the burners — it only opens when the board has proof of draft and a hot igniter, and it slams shut the instant flame proof is lost.",
    failureSigns:
      "Igniter glows bright orange but no whoosh ever comes — the valve isn't opening. A rare but real failure; also the one part nobody should ever 'adjust' without a manometer and a license.",
  },
  {
    id: "transformer",
    name: "24V Transformer",
    zone: "indoor",
    path: "electrical",
    role: "Steps line voltage down to 24 volts — the control voltage that every thermostat wire, safety switch, and relay coil in the system runs on.",
    failureSigns:
      "Completely dead controls with the breakers ON: blank thermostat, no clicks, nothing. Transformers usually die as collateral — a shorted thermostat wire or stuck contactor coil burns them (or the 3–5A blade fuse on the board that protects them).",
  },
  {
    id: "service-wiring",
    name: "Service Wiring & Whip",
    zone: "outdoor",
    path: "electrical",
    role: "The exposed copper outside the equipment: the 240V whip conduit from the disconnect into the condenser, and the thin 18-gauge thermostat wires linking stat, furnace, and outdoor unit.",
    failureSigns:
      "Intermittent or dead cooling from chewed, sun-rotted, or trimmer-cut low-voltage wires at the outdoor unit — one of the cheapest faults and one of the most misdiagnosed. Also loose lugs arcing in the whip, and control shorts that repeatedly blow the transformer fuse.",
  },
  {
    id: "flex-duct",
    name: "Flex Duct (Attic Silver Duct)",
    zone: "distribution",
    path: "airflow",
    role: "The big silver hoses in the attic: an inner plastic liner on a wire helix, wrapped in fiberglass insulation and a foil jacket, carrying air from the trunk to each room's vent.",
    failureSigns:
      "One room with almost no airflow (a crushed or kinked bend strangles it), a torn foil jacket sweating in a humid attic, or a connection that slipped off entirely — quietly air-conditioning the attic. Sharp bends and long saggy runs cost real capacity.",
  },
  {
    id: "control-board",
    name: "Control / Defrost Board",
    zone: "indoor",
    path: "electrical",
    role: "The circuit board that sequences everything: ignition retries, blower delays, fault codes — and on heat pumps, reads the outdoor sensor to decide when defrost and auxiliary heat are allowed to run.",
    failureSigns:
      "Blinking fault LEDs, random lockouts, or the silent failure: a bad sensor reading that latches 4–5x-cost auxiliary heat on all winter, or never runs defrost until the outdoor unit is an ice block. The bill is often the only symptom.",
  },
  {
    id: "aux-heat-strips",
    name: "Auxiliary Heat Strips",
    zone: "indoor",
    path: "electrical",
    role: "Electric resistance elements in the air handler — a heat pump's backup for deep cold and defrost. Pure resistance heat costs 3–5x more per degree than the heat pump itself.",
    failureSigns:
      "They rarely 'break' — they get stuck ON: a faulty sensor board or mis-staged thermostat runs them constantly, and the only symptoms are a warm house and a shocking winter electric bill. The AUX/EM HEAT indicator lit on mild days is the tell.",
  },
  {
    id: "ductwork",
    name: "Ductwork & Registers",
    zone: "distribution",
    path: "airflow",
    role: "The supply and return highways that move conditioned air to rooms and pull it back.",
    failureSigns:
      "Rooms that never get comfortable, whistling registers, dusty rooms, and bills out of proportion to equipment age. Typical homes leak 20–30% of duct air.",
  },
];

/* ---------------------------------------------------------------- *
 *  Symptoms (what a homeowner actually observes)
 * ---------------------------------------------------------------- */

export const SYMPTOMS: HvacSymptom[] = [
  { id: "warm-air", label: "AC runs but blows warm air", hint: "Vents push air, house doesn't cool" },
  { id: "no-power", label: "System won't turn on at all", hint: "No sound indoors or out" },
  { id: "weak-airflow", label: "Weak or no airflow from vents", hint: "System sounds on, little air moves" },
  { id: "short-cycling", label: "Starts and stops every few minutes", hint: "On/off in under 10-minute bursts" },
  { id: "ice", label: "Ice on refrigerant lines or coil", hint: "Frost on copper lines or indoor coil" },
  { id: "water-leak", label: "Water around the indoor unit", hint: "Puddle at furnace/air handler" },
  { id: "outdoor-silent", label: "Indoor blower runs, outdoor unit silent", hint: "Air moves but never cools" },
  { id: "humming-clicking", label: "Outdoor unit hums or clicks, won't start", hint: "Buzz/click, fan not spinning" },
  { id: "loud-noise", label: "Grinding, screeching, or banging", hint: "Mechanical noise indoors or out" },
  { id: "burning-smell", label: "Burning or electrical smell", hint: "From vents or the unit itself" },
  { id: "high-bills", label: "Energy bills noticeably higher", hint: "Same weather, bigger bill" },
  { id: "uneven-temps", label: "Some rooms hot, some cold", hint: "Comfort varies room to room" },
  { id: "constant-running", label: "Runs constantly, never hits set temp", hint: "Never satisfies the thermostat" },
  { id: "no-heat", label: "Furnace runs but air isn't warm", hint: "Blower on, air cool or cold" },
  { id: "no-ignite", label: "Furnace clicks but never fires up", hint: "Click-click, no whoosh of burners" },
  { id: "winter-bills", label: "Winter electric bill 3–5x normal", hint: "House warm, bill catastrophic" },
  { id: "em-heat-on", label: "Thermostat shows AUX/EM HEAT constantly", hint: "Backup-heat light on even in mild weather" },
  { id: "outdoor-ice-winter", label: "Outdoor unit caked in ice (winter)", hint: "Heat pump encased in frost/ice for days" },
  { id: "clammy", label: "House cool but humid / clammy", hint: "Temperature OK, air feels sticky" },
  { id: "musty-smell", label: "Musty smell when it runs", hint: "Dirty-sock / mildew odor from vents" },
  { id: "gas-smell", label: "I smell gas / rotten eggs", emergency: true, hint: "LEAVE FIRST - call from outside" },
  { id: "co-alarm", label: "CO alarm went off", emergency: true, hint: "LEAVE FIRST - call 911 / gas utility" },
];

/* ---------------------------------------------------------------- *
 *  Faults (the diagnoses)
 * ---------------------------------------------------------------- */

export const FAULTS: HvacFault[] = [
  {
    id: "clogged-filter",
    name: "Clogged air filter",
    severity: "diy",
    prior: 10,
    components: ["air-filter", "blower", "evaporator-coil"],
    symptoms: ["weak-airflow", "ice", "warm-air", "short-cycling", "high-bills", "constant-running", "no-heat"],
    cause:
      "A loaded filter chokes return airflow. The evaporator coil gets too little warm air, runs too cold, and ices over; in winter the furnace overheats and trips its limit switch. This is the single most common cause of HVAC problems.",
    checks: [
      "Pull the filter and hold it up to a light — if you can't see light through it, it's the problem.",
      "Check the coil and refrigerant lines for ice while you're there.",
      "Note the filter size printed on the frame before you toss it.",
    ],
    fix: "Replace the filter (1\" filters every 1–3 months, 4–5\" media filters every 6–12). If the coil iced, run fan-only for a few hours to thaw before cooling again.",
    costHint: "$5–$40 DIY",
  },
  {
    id: "thermostat-fault",
    name: "Thermostat dead or misconfigured",
    severity: "diy",
    prior: 8,
    components: ["thermostat"],
    symptoms: ["no-power", "outdoor-silent", "short-cycling", "constant-running", "no-heat"],
    cause:
      "Dead batteries, a mode switch left on HEAT in July, a schedule/hold override, or a loose low-voltage wire. The equipment is fine — it's just never being told to run, or being told to run wrong.",
    checks: [
      "Is the screen on? Replace batteries if blank or flashing low-batt.",
      "Confirm mode (COOL/HEAT) and that the set point is past room temperature by 3–5°F.",
      "Switch FAN to ON — if the blower starts, the thermostat and low-voltage circuit are alive.",
      "Check for a tripped float switch or open furnace door panel, which interrupt the same circuit.",
    ],
    fix: "Batteries, correct settings, or a replacement thermostat. A basic replacement is one of the safest DIY electrical jobs (low voltage) if you photograph the wiring first.",
    costHint: "$0–$150 DIY · $250–$500 installed smart stat",
  },
  {
    id: "tripped-breaker",
    name: "Tripped breaker / pulled disconnect",
    severity: "diy",
    prior: 8,
    components: ["breaker-disconnect"],
    symptoms: ["no-power", "outdoor-silent"],
    cause:
      "The AC condenser and the furnace/air handler are on separate breakers, and outdoor units also have a service disconnect by the unit. A power blip, a weak breaker, or someone's yard work can leave one leg dead.",
    checks: [
      "At the panel, find the AC/furnace breakers — a tripped one sits between ON and OFF. Flip fully OFF, then ON.",
      "Check the disconnect box beside the outdoor unit: the pull-out block must be seated, right-side up.",
      "If the breaker trips again immediately, STOP — that's a short or failing compressor, not a nuisance trip.",
    ],
    fix: "A one-time reset is fine. Repeat trips mean a pro visit: repeatedly resetting into a fault can turn a $30 part into a $2,000 compressor.",
    costHint: "$0 DIY reset · repeat trips: diagnostic call $100–$200",
  },
  {
    id: "failed-capacitor",
    name: "Failed run capacitor",
    severity: "pro",
    prior: 9,
    components: ["capacitor", "compressor", "condenser-fan"],
    symptoms: ["humming-clicking", "warm-air", "outdoor-silent", "short-cycling"],
    cause:
      "Capacitors are the most-replaced part in air conditioning. Heat and age dry them out; the motors they start then hum without spinning and overheat. A bulged or leaking top is the giveaway.",
    checks: [
      "Listen at the outdoor unit for a hum or click every few minutes with no fan movement.",
      "Look (don't touch) through the top grille: is the fan still while the unit buzzes?",
      "Classic tech trick — if the fan spins up when pushed with a stick through the grille, the capacitor is toast.",
    ],
    fix: "A technician discharges and swaps the capacitor, matched to µF and voltage rating. Capacitors hold a charge after power-off — this is a cheap fix for a pro and a genuinely dangerous one for DIY.",
    costHint: "$150–$400 pro (part itself is $15–$45)",
  },
  {
    id: "failed-contactor",
    name: "Pitted or stuck contactor",
    severity: "pro",
    prior: 6,
    components: ["contactor"],
    symptoms: ["humming-clicking", "outdoor-silent", "constant-running"],
    cause:
      "The contactor's points arc every single cycle and eventually pit, burn, or weld. Burned points starve the unit of power; welded points do the opposite — the outdoor unit keeps running after the thermostat is satisfied.",
    checks: [
      "Outdoor unit dead while indoor blower runs? Chattering or loud buzzing from the unit's electrical panel?",
      "Unit still running with the thermostat off/satisfied — kill it at the breaker and call it in; that's welded contacts.",
    ],
    fix: "Straightforward pro replacement, often done in the same visit as a capacitor since they age together.",
    costHint: "$150–$350 pro",
  },
  {
    id: "refrigerant-leak",
    name: "Refrigerant leak / low charge",
    severity: "pro",
    prior: 7,
    components: ["refrigerant-lines", "service-valves", "evaporator-coil", "compressor", "refrigerant-pressure-switches"],
    symptoms: ["warm-air", "ice", "constant-running", "high-bills", "outdoor-ice-winter", "no-heat", "winter-bills"],
    cause:
      "Refrigerant doesn't get 'used up' — if it's low, it leaked. Low charge drops coil pressure and temperature until it ices over; the system limps along cooling poorly, and running it low slowly cooks the compressor.",
    checks: [
      "Ice or frost on the copper lines or coil with a clean filter is the classic signature.",
      "Look for oily residue at line fittings — refrigerant carries oil, so leaks leave oil stains.",
      "Cooling that fades over weeks (not overnight) points to a slow leak.",
      "Check both service-valve caps on the outdoor unit are present and snug — a leaking Schrader core under a missing cap is one of the most common leak-search findings.",
      "Read the refrigerant type off the nameplate before talking repairs: R-22 (pre-2010) usually totals the system, R-410A runs $75–$150+/lb under the phasedown, and new A2L systems (R-454B/R-32) need A2L-rated parts.",
    ],
    fix: "A pro must find and repair the leak, then weigh in the correct charge (EPA-certified work — federal law, not gatekeeping). Insist on a leak search: 'just topping off' every spring pays for a new coil in three summers.",
    costHint: "$250–$600 leak search · recharge alone $300–$800 · $1,800–$4,500 coil (2026)",
  },
  {
    id: "dirty-condenser",
    name: "Dirty / blocked condenser coil",
    severity: "diy",
    prior: 7,
    components: ["condenser-coil", "refrigerant-pressure-switches"],
    symptoms: ["high-bills", "warm-air", "constant-running", "short-cycling"],
    cause:
      "Grass clippings, cottonwood fluff, and dirt mat the outdoor coil's fins. The system can't reject heat, head pressure climbs, capacity drops, and on hot days it may trip off on high pressure entirely.",
    checks: [
      "Look at the fins around the outdoor unit — visible mats of fluff, dirt, or bent fins?",
      "Feel the air blowing out the top while running: a blocked coil makes the discharge weak but HOTTER than normal (heat can't leave). Weak AND cool discharge points at low charge or a compressor not pumping — a different problem.",
      "Check clearance: the unit wants 2 feet clear on all sides.",
    ],
    fix: "Kill power at the disconnect, then rinse the coil gently from the inside out with a garden hose (never a pressure washer — it folds fins like paper). Do it every spring.",
    costHint: "$0 DIY · $100–$250 as part of a pro tune-up",
  },
  {
    id: "condenser-fan-failure",
    name: "Condenser fan motor failure",
    severity: "pro",
    prior: 5,
    components: ["condenser-fan", "capacitor", "refrigerant-pressure-switches"],
    symptoms: ["short-cycling", "warm-air", "loud-noise"],
    cause:
      "Fan motor bearings dry out and seize, or its capacitor dies. Without the fan, the condenser can't reject heat — pressure spikes and the compressor cuts out on its internal overload within minutes, over and over.",
    checks: [
      "Compressor humming but fan blade still, top of the unit radiating serious heat.",
      "Screech or growl from the outdoor unit at startup.",
      "Blade wobble visible through the top grille.",
    ],
    fix: "Motor (and usually blade + capacitor) replacement. Shut the system off until it's fixed — every high-pressure trip is a punch to the compressor.",
    costHint: "$300–$700 pro",
  },
  {
    id: "frozen-evaporator",
    name: "Frozen evaporator coil",
    severity: "diy",
    prior: 6,
    components: ["evaporator-coil", "air-filter", "refrigerant-lines", "blower"],
    symptoms: ["ice", "weak-airflow", "warm-air", "water-leak"],
    cause:
      "A symptom masquerading as a fault: anything that starves the coil of warm air (dirty filter, dead blower, closed vents) or starves it of refrigerant (leak) drives coil temperature below freezing. Ice then blocks airflow entirely, and the melt floods the pan.",
    checks: [
      "Kill cooling, run FAN ONLY, and give it 2–4 hours to thaw (towels down).",
      "While it thaws, check the filter — the culprit in most cases.",
      "After thaw, run cooling with a clean filter. If ice returns anyway, it's refrigerant or blower — book a pro.",
    ],
    fix: "Thaw + fix the airflow cause yourself; recurring ice with good airflow means a leak or TXV problem, which is pro territory.",
    costHint: "$0–$40 DIY if it's airflow · else see refrigerant leak",
  },
  {
    id: "clogged-condensate",
    name: "Clogged condensate drain",
    severity: "diy",
    prior: 8,
    components: ["condensate-drain", "drain-cleanout-tee", "emergency-pan", "float-switch"],
    symptoms: ["water-leak", "no-power", "short-cycling"],
    cause:
      "Algae and gunk clog the drain line, the pan fills, and either water overflows (ceiling stains under attic units) or the float switch cuts the whole system dead — the #1 cause of 'AC died on the hottest day' calls that turn out fine.",
    checks: [
      "Look for standing water in the pan under/beside the indoor coil.",
      "Find the float switch (small cylinder on the pan or drain pipe) — if lifting it kills/restores the system, the drain is your problem.",
      "Check the drain line's outdoor termination for drips — none while cooling on a humid day means it's blocked. Caution: a stub that terminates OVER A WINDOW or at the soffit is the emergency line — dripping THERE means the primary already failed; call now.",
    ],
    fix: "Pull the gunk out at the outdoor end with a wet/dry vac sealed to the pipe, then pour a cup of distilled vinegar into the cleanout tee every couple of months.",
    costHint: "$0–$20 DIY · $100–$250 pro clear-out",
  },
  {
    id: "blower-failure",
    name: "Blower motor failure",
    severity: "pro",
    prior: 5,
    components: ["blower", "blower-run-capacitor"],
    symptoms: ["weak-airflow", "burning-smell", "loud-noise", "no-heat", "no-power"],
    cause:
      "Bearings wear, windings overheat (often after years of dirty-filter strain), or the ECM control module dies. No blower means no airflow: the AC coil freezes and the furnace trips its high-limit.",
    checks: [
      "Thermostat calling, system 'on', but nothing from any vent.",
      "Screech/grind from the indoor cabinet, or a hot electrical smell.",
      "Hum from the cabinet with no airflow = motor trying and failing to start.",
    ],
    fix: "Kill power if it smells hot. Motor or module replacement is pro work; on a 15+ year system, price it against replacement before committing.",
    costHint: "$450–$1,500 pro (ECM modules at the high end)",
  },
  {
    id: "dirty-coil-blower",
    name: "Dirty evaporator coil / blower wheel",
    severity: "pro",
    prior: 6,
    components: ["evaporator-coil", "blower", "air-filter"],
    symptoms: ["musty-smell", "clammy", "weak-airflow", "high-bills", "constant-running"],
    cause:
      "Years of dust that got past neglected filters mats the indoor coil's fins and cakes the blower wheel's blades. Airflow and capacity quietly sink, the wet coil grows the biofilm behind 'dirty sock syndrome,' and the house reads cool-ish but clammy because a slow, fouled coil stops dehumidifying. The #1 comfort complaint driver in humid climates — and the #1 year-one problem in new construction, where drywall dust cakes the wheel before the first summer.",
    checks: [
      "Musty or dirty-sock smell that starts when the blower kicks on — not constant — points at the wet indoor coil.",
      "Weak airflow WITH a clean filter: shine a light at the blower wheel blades; caked blades hold visible crud.",
      "House at set temperature but sticky on humid days = coil moving too little air to wring moisture out.",
    ],
    fix: "A pro pulls and cleans the blower wheel and washes the coil in place. Not hazardous, but fins and wheel balance are easy to ruin — and it's exactly the $150–$400 fix that prevents a misdiagnosed $1,500 blower motor or 'needs freon' call.",
    costHint: "$150–$400 pro cleaning · $40/yr of filters prevents it",
  },
  {
    id: "duct-leakage",
    name: "Leaky or unbalanced ductwork",
    severity: "pro",
    prior: 6,
    components: ["ductwork"],
    symptoms: ["uneven-temps", "high-bills", "weak-airflow", "constant-running"],
    cause:
      "The average home leaks 20–30% of conditioned air into attics and crawlspaces through unsealed joints, crushed flex duct, and disconnected runs. The equipment is healthy; the delivery system is bleeding out.",
    checks: [
      "Are the uncomfortable rooms the ones farthest from the furnace?",
      "Inspect visible attic/crawlspace duct: look for disconnected runs, crushed sections, dangling tape.",
      "Dusty house + whistling registers + big bills is the classic leak trio.",
    ],
    fix: "Seal accessible joints with mastic (not 'duct tape', which ironically fails on ducts), then have a pro balance or pressure-test the system. Sealing is one of the highest-ROI fixes in HVAC.",
    costHint: "$20–$60 DIY mastic · $500–$2,000 pro seal & balance",
  },
  {
    id: "compressor-failure",
    name: "Compressor failing or seized",
    severity: "pro",
    prior: 3,
    components: ["compressor"],
    symptoms: ["humming-clicking", "warm-air", "loud-noise", "high-bills", "outdoor-silent"],
    cause:
      "The end-stage failure, usually caused by years of running low on charge, chronic overheating from a dirty condenser, or repeated hard starts through a bad capacitor. Windings short or the mechanism seizes.",
    checks: [
      "Loud clunk + lights dimming at start, breaker trips, or a hum that shuts off on internal overload.",
      "Rule the capacitor out first — its symptoms are identical and it's 10% of the cost.",
      "Get the compressor's electrical readings tested (megohm/winding test) before believing a replacement quote.",
      "Hard-starting on an aging but running compressor? Ask about a $30–$60 hard-start kit before accepting a replacement quote — the standard counter answer to 'the lights dim when the AC starts.'",
    ],
    fix: "On a system under ~10 years, compressor replacement can make sense (often under parts warranty). Older than that, put the money toward a new condenser or full system instead.",
    costHint: "$1,500–$3,000 replace compressor · $6,500–$12,000 new system (2026 A2L)",
  },
  {
    id: "txv-failure",
    name: "TXV stuck or failed",
    severity: "pro",
    prior: 3,
    components: ["txv", "evaporator-coil"],
    symptoms: ["ice", "warm-air", "constant-running"],
    cause:
      "A sticking thermostatic expansion valve starves or floods the coil. Starved coils ice at the inlet; flooded coils risk liquid slugging the compressor. Often misdiagnosed as 'low refrigerant' — a proper superheat/subcool reading tells them apart.",
    checks: [
      "Icing that returns with a clean filter, strong blower, and confirmed-full charge.",
      "This one is instrument-diagnosed — ask the tech for superheat and subcooling numbers, not a guess.",
    ],
    fix: "Valve replacement — brazing and a full evacuation/recharge, firmly pro work.",
    costHint: "$450–$1,200 pro",
  },
  {
    id: "flame-sensor",
    oemCodeHints: ["flame lost", "no flame sense", "3-strike ignition lockout"],
    appliesTo: "gas",
    name: "Dirty flame sensor",
    severity: "diy",
    prior: 7,
    components: ["igniter", "heat-exchanger"],
    symptoms: ["no-ignite", "no-heat", "short-cycling"],
    cause:
      "A thin rod that proves the burners lit. A whisker of oxide on it and the furnace can't 'see' flame — burners light, run 3–8 seconds, and die. After a few tries the board locks out. It's the most common furnace no-heat cause.",
    checks: [
      "Watch a heat cycle through the sight glass: ignition, brief flame, shutdown = flame sensor until proven otherwise.",
      "Count retries: three failed attempts then a long pause (lockout) with a blinking error LED on the board.",
    ],
    fix: "A pro cleans the rod with fine abrasive in minutes; comfortable DIYers do it too (power and gas off, one screw). It's maintenance, not a defect — annual cleaning prevents it.",
    costHint: "$0 DIY clean · $100–$250 pro visit",
  },
  {
    id: "failed-igniter",
    oemCodeHints: ["ignition failure", "igniter circuit fault"],
    appliesTo: "gas",
    name: "Cracked hot-surface igniter",
    severity: "diy",
    prior: 6,
    components: ["igniter"],
    symptoms: ["no-ignite", "no-heat"],
    cause:
      "The glowing ceramic igniter is brittle and simply cracks with age (5–10 year life). The board powers it, nothing glows, no ignition, lockout.",
    checks: [
      "Watch startup: inducer fan spins, then — no orange glow where the burners are — gas never opens.",
      "A click-click-click instead points to a spark-type igniter failing, same diagnosis path.",
    ],
    fix: "Inexpensive part, delicate swap (touching the new element with bare fingers shortens its life). Reasonable for a careful DIYer with gas off; cheap for a pro.",
    costHint: "$25–$60 part · $150–$350 pro",
  },
  {
    id: "cracked-heat-exchanger",
    appliesTo: "gas",
    name: "Cracked heat exchanger",
    severity: "urgent",
    prior: 2,
    components: ["heat-exchanger"],
    symptoms: ["burning-smell", "no-heat", "short-cycling"],
    cause:
      "Metal fatigue after 15–25 years of heat cycles (accelerated by airflow problems) cracks the wall separating combustion gases from your breathing air. This is the carbon-monoxide scenario — the reason CO detectors belong near every furnace.",
    checks: [
      "CO alarm, soot streaks, a flame that dances when the blower kicks on, or a persistent chemical smell: shut the furnace off now.",
      "Demand visual/camera evidence of the crack — this diagnosis is also a classic pressure-sales tactic.",
    ],
    fix: "Furnace off until verified. A confirmed crack on an old furnace means replacement; exchangers carry long warranties but the labor usually makes a new unit smarter.",
    costHint: "$2,000–$3,500 exchanger job · $3,500–$7,500 new furnace",
  },
  {
    id: "door-switch-open",
    name: "Blower door not seated (door switch open)",
    severity: "diy",
    prior: 5,
    components: ["blower-door-switch"],
    symptoms: ["no-power"],
    cause:
      "Every UL-listed furnace kills its own power the moment the blower compartment door comes off, via a small plunger switch behind the panel. Re-hang that door a quarter-inch off after a filter change and the furnace plays completely dead — no lights, no clicks, blank thermostat. This is the #1 cause of the 'I changed my filter and now it's dead' call.",
    checks: [
      "Did anyone change the filter or remove a panel recently? Press the blower door firmly inward — if the system springs to life, done.",
      "Remove and re-hang the door properly: bottom lip seated, top latched, no rattle.",
      "If you find the switch taped or zip-tied down, someone bypassed a safety — undo it and have the door fixed instead.",
    ],
    fix: "Re-seat the door. A worn switch is a cheap part; a bypassed one is a hazard (it exists so nobody meets a spinning blower or live board barehanded).",
    costHint: "$0 DIY · $75–$150 pro switch swap",
  },
  {
    id: "furnace-trap-clog",
    oemCodeHints: ["pressure switch stuck open (water)", "draft fault"],
    appliesTo: "gas",
    name: "Furnace condensate trap clogged (winter water)",
    severity: "diy",
    prior: 4,
    components: ["furnace-condensate-trap", "inducer-fan", "flue-vent-pipe"],
    symptoms: ["no-heat", "no-ignite", "water-leak"],
    cause:
      "High-efficiency furnaces wring acidic water out of their exhaust all winter, and it all drains through one small plastic trap. When the trap silts up, water backs into the inducer housing, the pressure switch can't prove draft, and the furnace locks out — the classic mid-winter no-heat on a 90%+ furnace. It also explains the puzzle the summer condensate story can't: water around a furnace in January.",
    checks: [
      "90%+ furnace (white PVC vent pipes) locking out in cold weather with pressure-switch codes? Suspect the trap before the switch.",
      "Gurgling at startup, or water in/under the furnace cabinet during heating season.",
      "Classic confirmation: furnace runs fine after the trap is pulled, tipped, and drained — then fails again days later as it re-clogs.",
    ],
    fix: "Pull the trap, flush it and its hoses with warm water, reinstall. Ten minutes, most cabinets. Make it an every-fall ritual on condensing furnaces, same as vinegar in the AC drain every summer.",
    costHint: "$0 DIY flush · $150–$300 pro visit",
  },
  {
    id: "service-switch-off",
    name: "Service switch off / blown SSU fuse",
    severity: "diy",
    prior: 6,
    components: ["furnace-switch", "transformer"],
    symptoms: ["no-power", "no-heat"],
    cause:
      "The furnace's 120V feed runs through a plain-looking wall switch — in garages, at attic entrances, beside the unit — that anyone can flip believing it's a light. Many also hide a small cartridge fuse behind the plate. Off switch or blown fuse = furnace, blower, AND the 24V transformer all dead, so even the thermostat goes blank. It out-embarrasses the breaker as a 'dead system' cause because nobody knows the switch exists.",
    checks: [
      "Find the switch on or within sight of the furnace (garage wall, attic entry, closet door frame) — is it ON? Flip it and listen for the board/transformer to come alive.",
      "System died right after painters, storage shuffling, or anyone working near the furnace? This switch. Every time.",
      "Switch on but still dead: pull the plate and check the small cartridge fuse inside (with the breaker off), and the 3–5A blade fuse on the control board.",
    ],
    fix: "Flip it back on, or replace the fuse. If the fuse blows again, there's a real short downstream — see 'control short.' Consider labeling the switch 'FURNACE — DO NOT TURN OFF.'",
    costHint: "$0 DIY · $2–$5 fuse",
  },
  {
    id: "limit-rollout-trips",
    oemCodeHints: ["high limit open", "rollout switch open"],
    appliesTo: "gas",
    name: "High-limit or rollout switch tripping",
    severity: "pro",
    prior: 4,
    components: ["limit-switch", "air-filter", "blower", "heat-exchanger"],
    symptoms: ["short-cycling", "no-heat", "burning-smell"],
    cause:
      "The high-limit opens when the heat exchanger overheats — almost always because air isn't moving enough heat away: clogged filter, dying blower, closed or blocked vents. The furnace runs a few minutes, cuts burners, cools, relights: heating short-cycle. Rollout switches are the more serious cousin — they trip when flame physically escapes the burner area, and most latch until manually reset.",
    checks: [
      "Burners cutting out while the blower keeps running, on a repeating cycle = limit trips. Check the filter first, then open registers.",
      "Furnace fully locked out with a button-style switch near the burners that clicks when pressed = a tripped rollout. Reset it ONCE at most.",
      "A rollout that re-trips means flame is escaping — soot, scorching, possible exchanger or venting problem. Stop and book a pro.",
    ],
    fix: "Fix the airflow cause yourself (filter, vents). Weak/aging limit switches and anything rollout-related is pro work — rollout trips can be the smoke before the cracked-heat-exchanger fire.",
    costHint: "$0–$40 DIY airflow · $150–$400 pro switch/diagnosis",
  },
  {
    id: "condensate-pump-failure",
    name: "Condensate pump failed or clogged",
    severity: "diy",
    prior: 3,
    components: ["condensate-pump", "float-switch"],
    symptoms: ["water-leak", "no-power", "loud-noise"],
    cause:
      "Where drains can't flow downhill, a small pump lifts the water out — and its reservoir grows the same algae sludge as drain lines. A jammed float or dead motor either overflows quietly beside the furnace or (if its safety wire is connected) kills cooling like a float switch would. A pump rattling or running nonstop is one clog away from either.",
    checks: [
      "Water around a small plastic box beside the indoor unit — lift its lid: sludge and a stuck float are usually staring back.",
      "Pour a cup of water into the reservoir: the pump should kick on within seconds and quiet down when empty.",
      "System dead in summer + pump reservoir full = its safety switch did its job; the pump is the patient.",
    ],
    fix: "Rinse the reservoir and float annually; a replacement pump is a $50–$80 part with two hose clamps and a plug — honest DIY. Route the discharge line so it can't kink.",
    costHint: "$0–$80 DIY · $150–$300 pro",
  },
  {
    id: "reversing-valve-stuck",
    appliesTo: "heatpump",
    name: "Reversing valve stuck or leaking",
    severity: "pro",
    prior: 2,
    components: ["reversing-valve", "control-board", "compressor"],
    symptoms: ["no-heat", "warm-air", "high-bills", "constant-running"],
    cause:
      "A heat pump's reversing valve slides between heating and cooling. Stuck slide or dead solenoid: the system is locked in one mode — cold air on a heat call with a perfectly healthy compressor. A valve leaking internally is sneakier: it bypasses hot gas, capacity quietly drops in BOTH modes, and it convincingly impersonates 'low on refrigerant' until someone temperature-tests the four lines at the valve.",
    checks: [
      "Heat pump blowing the wrong temperature for the mode — after confirming the thermostat isn't simply set wrong (O/B wire setting matters here).",
      "Listen at mode change for the whoosh of the valve shifting; silence when switching heat↔cool points at the solenoid.",
      "Ask the tech for line temperatures at the valve's four ports — the leak-vs-low-charge divider.",
    ],
    fix: "Solenoid coil is a cheap swap; a stuck or leaking valve body means recovery, brazing, and recharge — solidly pro. On old units, price it against replacement.",
    costHint: "$100–$250 solenoid · $600–$1,500 valve body",
  },
  {
    id: "float-switch-stuck",
    name: "Float switch tripped or stuck",
    severity: "diy",
    prior: 3,
    components: ["float-switch", "emergency-pan", "condensate-drain"],
    symptoms: ["no-power", "short-cycling"],
    cause:
      "The float switch has exactly one job — open the 24V circuit when water backs up — and two ways to fail. Stuck tripped (or wedged by debris): the system stays dead with a bone-dry pan. Stuck free (or bypassed by a previous 'fix'): it never trips, and the failure announces itself through the ceiling instead.",
    checks: [
      "System dead in cooling season: find the small switch on the pan or drain line and check for water first — water means the drain is the real problem.",
      "Pan dry but system dead? Gently lift/lower the float; if the system springs to life, the switch was stuck or misadjusted.",
      "Look for a switch that's been unplugged or jumpered by a past 'repair' — that's a ceiling waiting to happen; reconnect it.",
    ],
    fix: "Re-seat, clean, or replace the switch ($15–$30 part, two wires, 24V). If it tripped on real water, clear the drain clog — the switch worked.",
    costHint: "$0–$30 DIY · $100–$200 pro",
  },
  {
    id: "inducer-pressure-switch",
    oemCodeHints: ["pressure switch stuck open", "pressure switch stuck closed", "draft fault"],
    appliesTo: "gas",
    name: "Inducer fan / pressure switch failure",
    severity: "pro",
    prior: 4,
    components: ["inducer-fan", "flue-vent-pipe", "control-board"],
    symptoms: ["no-ignite", "no-heat"],
    cause:
      "Before any ignition, the inducer fan must spin up and pull enough draft to close the pressure switch — proof the exhaust path is safe. A seized inducer motor, cracked inducer housing, blocked flue/intake, or a failed pressure switch means the board never even attempts ignition: a heat call that produces total silence.",
    checks: [
      "On a heat call, listen for the pre-ignition whir (30–60s before anything else). Silence = inducer or its power; whir but no ignition sequence = pressure switch or blocked venting.",
      "Check the intake/exhaust pipes outside for nests, leaves, snow, or ice.",
      "Read the board's flashing LED code — 'pressure switch stuck open' is one of the most common furnace codes.",
    ],
    fix: "Clear blocked venting yourself; a failed inducer motor or pressure switch is a pro replacement.",
    costHint: "$0 DIY vent clearing · $150–$350 pressure switch · $400–$900 inducer",
  },
  {
    id: "gas-valve-failure",
    appliesTo: "gas",
    name: "Gas valve not opening",
    severity: "pro",
    prior: 2,
    components: ["gas-valve", "gas-supply-shutoff", "control-board"],
    symptoms: ["no-ignite", "no-heat"],
    cause:
      "Everything else does its job — inducer proves draft, igniter glows bright orange — but the whoosh never comes because the 24V gas valve isn't opening. Failed coil in the valve, or the board isn't sending it power. Rarer than igniter and sensor failures, which is why it's diagnosed by elimination.",
    checks: [
      "First, the zero-dollar check: is the manual gas shutoff beside the furnace OPEN (handle parallel to the pipe)? Closed after other work is the classic impersonator of this fault.",
      "Watch a cycle: glowing igniter with no ignition and no gas smell points here (after the igniter itself is verified).",
      "A tech confirms 24V at the valve terminals during the ignition window — voltage present + no flow = dead valve.",
    ],
    fix: "Valve replacement, gas-side work — licensed pro only, no exceptions. If you ever smell gas: leave first, call from outside.",
    costHint: "$300–$700 pro",
  },
  {
    id: "control-short",
    name: "Control short — blown transformer or board fuse",
    severity: "pro",
    prior: 4,
    components: ["transformer", "service-wiring", "thermostat", "control-board"],
    symptoms: ["no-power"],
    cause:
      "The whole control system runs on 24V from one small transformer, protected by a 3–5A blade fuse on the board. A shorted thermostat wire (staple through it, chewed insulation at the outdoor unit, a wire pinched during other work) pops the fuse or burns the transformer — and every control in the house goes dead while the big breakers sit happily ON.",
    checks: [
      "Breakers ON but thermostat completely blank (and batteries are good): suspect the 24V side.",
      "Check the automotive-style blade fuse on the furnace control board — blown is visible.",
      "If a new fuse pops immediately, there's a short in the field wiring — often at the outdoor unit where wires are exposed.",
    ],
    fix: "Find and repair the shorted wire (splice/re-run), then replace the fuse or transformer. Cheap parts; the diagnosis is the work.",
    costHint: "$5 fuse · $80–$250 transformer · plus finding the short",
  },
  {
    id: "damaged-control-wires",
    name: "Damaged low-voltage wires at the outdoor unit",
    severity: "diy",
    prior: 4,
    components: ["service-wiring", "contactor"],
    symptoms: ["outdoor-silent", "no-power", "short-cycling"],
    cause:
      "The two thin thermostat wires feeding the outdoor contactor live outdoors: sun-rotted insulation, dog chew, weed-trimmer strikes. Broken = outdoor unit never gets the call; intermittently touching = cooling that comes and goes with the wind. Constantly misdiagnosed as a bad board or compressor.",
    checks: [
      "Inspect the thin wires where they leave the house and enter the condenser — look for nicks, bare copper, green corrosion.",
      "Wiggle test (gently) while someone watches the thermostat call: if the contactor clicks in and out, you found it.",
    ],
    fix: "Cut back to clean copper, splice with weatherproof connectors or re-run the short outdoor section, and sleeve it in conduit so it doesn't happen again. One of the few genuinely DIY-able electrical fixes (it's 24V).",
    costHint: "$5–$20 DIY · $150–$300 pro visit",
  },
  {
    id: "crushed-flex-duct",
    name: "Crushed, kinked, or disconnected flex duct",
    severity: "diy",
    prior: 5,
    components: ["flex-duct", "ductwork"],
    symptoms: ["weak-airflow", "uneven-temps", "high-bills", "constant-running"],
    cause:
      "The silver attic hoses only work stretched reasonably straight. A box stored on a run, a sharp bend at the trunk, a sagging span between joists, or an inner liner that tore loose — and one room's air supply drops to a trickle. A fully disconnected run is worse: it conditions the attic 24/7 and shows up as a mystery bill, not a comfort complaint.",
    checks: [
      "One specific room starved while others are fine points at that room's flex run, not the equipment.",
      "In the attic: follow the silver duct to that room's boot. Look for crushing, kinks sharper than a gentle curve, and jacket tears.",
      "Feel for conditioned air blowing anywhere it shouldn't be — a slipped-off connection is loud about it.",
    ],
    fix: "Re-suspend sagging runs, replace crushed sections (flex is cheap), re-clamp and mastic-seal slipped connections, and keep bends gentle. This is honest DIY territory for anyone comfortable in an attic.",
    costHint: "$20–$60 DIY per run · $200–$500 pro",
  },
  {
    id: "frozen-condensate-line",
    appliesTo: "gas",
    name: "Frozen condensate line (condensing furnace)",
    severity: "diy",
    prior: 3,
    components: ["condensate-drain", "furnace-condensate-trap", "condensate-pump"],
    symptoms: ["no-heat", "no-ignite", "water-leak"],
    cause:
      "A high-efficiency furnace drains water all winter — and any stretch of that drain routed through a garage, crawlspace, or along a rim joist can freeze solid in a cold snap. Backed-up water floods the trap and inducer housing, the pressure switch can't prove draft, and the furnace locks out at the exact moment you need it most. A top-5 January no-heat call in cold climates, and it presents identically to a silted trap.",
    checks: [
      "No-heat during a hard freeze on a 90%+ furnace (white PVC pipes), with pressure-switch codes: before blaming the trap, follow the little vinyl/PVC drain line — does it pass through unheated space?",
      "Feel the line: a frozen section is rock hard and often visibly bulged.",
      "Furnace runs again after the house-side line is thawed (warm towels, hair dryer on low) = confirmed.",
    ],
    fix: "Thaw it gently, then fix the routing: re-slope so nothing pools, insulate or heat-tape the cold-space run, or reroute to an interior drain. The thaw is DIY; making it never happen again is an afternoon with pipe insulation.",
    costHint: "$0 thaw · $20–$60 insulation/heat tape · $150–$350 pro reroute",
  },
  {
    id: "aux-heat-dead",
    appliesTo: "heatpump",
    name: "Backup heat strips dead (burned element / blown links)",
    severity: "pro",
    prior: 3,
    components: ["aux-heat-strips", "control-board", "breaker-disconnect"],
    symptoms: ["no-heat", "constant-running"],
    cause:
      "The opposite of the runaway-bill failure — and in deep cold, the more dangerous one. Burned-out elements, blown one-shot fusible links, a failed sequencer, or a tripped strip breaker silently kill the backup heat. Nobody notices in mild weather because the heat pump carries the load alone… until the first real cold snap, when the house can't hold temperature and pipes are suddenly at risk. At -10°F this is a habitability emergency, not a comfort complaint.",
    checks: [
      "Heat pump running nonstop in a cold snap, house slowly LOSING ground, supply air only lukewarm (90–100°F, never the 105–125°F strip boost).",
      "Flip the thermostat to EMERGENCY HEAT: if the air doesn't get noticeably hotter within minutes, the strips aren't coming on at all.",
      "Check for a second breaker (strips often have their own 60A pair) that's tripped.",
    ],
    fix: "A pro tests elements, fusible links, and the sequencer, and replaces the dead bank. Do the EM HEAT test on the first cool fall day — not at midnight in January.",
    costHint: "$150–$300 element/link · $200–$450 sequencer · strips have their own breaker: $0 reset",
  },
  {
    id: "stuck-aux-heat",
    oemCodeHints: ["outdoor sensor out of range", "aux staging fault"],
    appliesTo: "heatpump",
    name: "Aux/emergency heat stuck on (faulty sensor board)",
    severity: "pro",
    prior: 4,
    components: ["control-board", "defrost-sensor", "outdoor-air-sensor", "aux-heat-strips", "thermostat"],
    symptoms: ["winter-bills", "em-heat-on", "high-bills", "constant-running"],
    cause:
      "On a heat pump, backup resistance strips cost 3–5x more per unit of heat than the compressor. They're supposed to run only in deep cold or during defrost — but a faulty outdoor sensor, a board misreading conditions, or a welded heat-strip sequencer relay (the part that physically switches the strips) can latch them on all winter. Nothing feels broken: the house is warm, the system is quiet, and the only symptom is a catastrophic electric bill. A mis-staged thermostat (aggressive setback schedules that trigger aux on every recovery) causes the same bill with healthy hardware.",
    checks: [
      "Watch the thermostat on a mild (45°F+) day: AUX or EM HEAT showing while it maintains temperature is the tell.",
      "Compare kWh with last winter or a neighbor's all-electric home — 3–5x is strips, not rates.",
      "Feel supply air during steady heating: strips make it noticeably hotter (~105–125°F) than heat-pump-only air (~90–100°F).",
      "Have a tech verify strip amp draw and read the board's sensor values against an actual thermometer — this is exactly what a good consultant finds.",
    ],
    fix: "Replace the faulty outdoor/defrost sensor or control board, and confirm the thermostat's staging (aux lockout above ~35–40°F, gradual recovery instead of aggressive setbacks). The repair typically pays for itself within one billing cycle.",
    costHint: "$150–$350 sensor · $300–$650 board · $0 if it's thermostat staging",
  },
  {
    id: "defrost-failure",
    oemCodeHints: ["defrost fault", "coil sensor out of range"],
    appliesTo: "heatpump",
    name: "Defrost failure — outdoor unit becomes an ice block",
    severity: "pro",
    prior: 3,
    components: ["control-board", "defrost-sensor", "condenser-coil", "condenser-fan"],
    symptoms: ["outdoor-ice-winter", "winter-bills", "no-heat", "constant-running"],
    cause:
      "A heat pump's outdoor coil naturally frosts in winter; the defrost board periodically reverses the cycle to melt it. When the board or its sensor fails, frost compounds into solid ice, airflow through the coil dies, heating capacity collapses — and the auxiliary strips silently take over the whole load at 3–5x cost. Light frost is normal; an ice-encased unit for days is not.",
    checks: [
      "Look at the outdoor unit after a cold night: a thin frost that clears periodically is normal, a solid ice shell is a defrost failure.",
      "Listen for the defrost cycle (a whoosh and a steam plume every 30–90 minutes in freezing weather) — silence for hours while iced is the confirmation.",
      "Check for weak, cool-ish supply air plus an outdoor unit that never seems to shed its ice.",
    ],
    fix: "A tech tests the defrost sensor/thermostat and board, and replaces the failed part. Don't chip ice off the coil — the fins bend like paper; a garden hose on a mild day is the safe thaw.",
    costHint: "$150–$400 sensor · $300–$650 board",
  },
  {
    id: "oversized-system",
    name: "Oversized or poorly matched system",
    severity: "pro",
    prior: 3,
    components: ["ductwork", "thermostat"],
    symptoms: ["short-cycling", "uneven-temps", "high-bills"],
    cause:
      "An oversized AC blasts the thermostat cold in 5 minutes and shuts off before it dehumidifies or reaches far rooms — clammy air, hot bedrooms, and start/stop wear. Common after a 'bigger is better' replacement.",
    checks: [
      "Short 5–8 minute cool cycles even in mild weather, from day one of the install (not a new development).",
      "House cool but sticky/humid is the oversizing fingerprint.",
    ],
    fix: "Band-aids: slower blower speeds, a thermostat with cycle control. Real fix: correct sizing (Manual J load calculation) at replacement time — get it in writing from any installer.",
    costHint: "$0–$400 tuning · sizing fixed only at replacement",
  },
];

/* ---------------------------------------------------------------- *
 *  Scenarios — real service calls as guided, animated walkthroughs.
 *  Each step drives the 3D scene: which parts glow, whether the
 *  system runs, whether the drain outlet drips.
 * ---------------------------------------------------------------- */

export interface ScenarioStep {
  title: string;
  text: string;
  highlight: string[];
  running: boolean;
  /** Show water dripping from the condensate drain's outdoor outlet. */
  drip?: boolean;
  /** Water level in the emergency pan, 0..1 — drives the visible fill. */
  panWater?: number;
  /** Float switch has lifted and opened the 24V circuit (renders red). */
  floatTripped?: boolean;
}

export interface HvacScenario {
  id: string;
  title: string;
  symptomSummary: string;
  steps: ScenarioStep[];
  verdict: string;
  /** Fault this scenario diagnoses. Absent on healthy-baseline sequences. */
  faultId?: string;
  /** "healthy" = how the system is SUPPOSED to work; default "fault". */
  kind?: "fault" | "healthy";
}

export const SCENARIOS: HvacScenario[] = [
  {
    id: "cooling-startup",
    kind: "healthy",
    title: "Cooling start-up: from the breaker panel to cold air",
    symptomSummary:
      "The healthy baseline. Every fault on this page is a break somewhere in this exact chain — know the chain and you know where to look.",
    steps: [
      {
        title: "Power waits at the panel",
        text:
          "Two circuits leave the breaker panel: 240V for the outdoor condenser (through the pull-out disconnect and the whip conduit) and 120V for the furnace — through the service switch on the garage or attic wall that everyone mistakes for a light switch. Right now everything is energized but idle — nothing runs until something asks.",
        highlight: ["breaker-disconnect", "service-wiring", "furnace-switch"],
        running: false,
      },
      {
        title: "The transformer makes the control voltage",
        text:
          "Inside the air handler, a small transformer steps 120V down to 24V. This 24V is the system's nervous system: every thermostat wire, float switch, door switch, and relay coil speaks it. Big power moves nothing until small power gives the order.",
        highlight: ["transformer"],
        running: false,
      },
      {
        title: "You lower the set point",
        text:
          "The thermostat compares room temperature to your target and closes two 24V circuits: Y (cooling) and G (fan). That's all a thermostat is — a temperature-operated switch. The 'call' travels down the thin copper wires toward the equipment.",
        highlight: ["thermostat", "service-wiring"],
        running: false,
      },
      {
        title: "The board checks the safeties",
        text:
          "The control board passes the call through the safety chain: condensate float switch not tripped, door panel seated, limits closed. Any one of them open and the start dies right here — which is exactly why a full drain pan impersonates a dead system.",
        highlight: ["control-board", "float-switch", "condensate-drain"],
        running: false,
      },
      {
        title: "The contactor slams in outside",
        text:
          "24V reaches the contactor's coil at the condenser; it pulls 240V contacts closed with an audible clunk. High voltage now floods the outdoor unit through the whip. This clunk-then-hum is the sound of a healthy start.",
        highlight: ["contactor", "service-wiring"],
        running: false,
      },
      {
        title: "The capacitor kick",
        text:
          "The compressor and condenser fan are single-phase motors — they can't start themselves. The run capacitor provides the phase-shifted jolt that snaps them into rotation. Fan spins up top, compressor thumps alive below. (When this part dies, you get hum-click-silence instead.)",
        highlight: ["capacitor", "compressor", "condenser-fan"],
        running: true,
      },
      {
        title: "The refrigerant loop comes alive",
        text:
          "The compressor squeezes refrigerant hot and shoves it through the condenser coil (heat leaves out the top with the fan's air). The liquid line carries it back indoors, the TXV meters it into the evaporator coil, and the coil surface drops to ~40°F.",
        highlight: ["compressor", "condenser-coil", "refrigerant-lines", "txv", "evaporator-coil"],
        running: true,
      },
      {
        title: "The blower moves the house through it",
        text:
          "Indoors, the blower pulls room air through the return and filter and pushes it across that cold coil. Heat and humidity transfer into the refrigerant; the air leaves ~20°F cooler than it arrived.",
        highlight: ["blower", "air-filter", "evaporator-coil"],
        running: true,
      },
      {
        title: "Cold air rides the ducts — and water starts to drip",
        text:
          "Supply air climbs the plenum, rides the trunk, and branches through the silver flex ducts to every register. Meanwhile the humidity condensing on the coil starts dripping down the drain line — within minutes the outdoor drain outlet drips steadily. Both flows moving = system healthy.",
        highlight: ["ductwork", "flex-duct", "condensate-drain"],
        running: true,
        drip: true,
      },
      {
        title: "Satisfied — and the shutdown order",
        text:
          "Room reaches set point; the thermostat opens Y. The contactor drops, the outdoor unit stops, and the blower runs ~60–90 seconds longer to harvest the cold left in the coil. Most stats then enforce a 5-minute anti-short-cycle delay. A healthy cycle is 10–20 minutes — much shorter, look up 'short cycling' below.",
        highlight: ["thermostat"],
        running: false,
      },
    ],
    verdict:
      "That chain — breaker → transformer → thermostat → safeties → contactor → capacitor → refrigerant loop → blower → ducts → drain — is the whole machine. Every fault in the library below is one of these links breaking, and the diagnose tab is really asking: which link?",
  },
  {
    id: "heating-startup",
    kind: "healthy",
    title: "Gas heat cycle: from the W call to warm vents",
    symptomSummary:
      "The healthy heating baseline for a gas furnace — including the deliberate delays people mistake for problems.",
    steps: [
      {
        title: "The W call and the pre-purge",
        text:
          "Thermostat closes R→W. The board doesn't light anything yet: first the inducer fan runs ~30–60 seconds, proving draft and purging old gas from the heat exchanger. This pause is by design — not a fault.",
        highlight: ["thermostat", "control-board", "inducer-fan"],
        running: false,
      },
      {
        title: "The igniter glows, gas flows",
        text:
          "The hot-surface igniter heats to orange (~2500°F), the gas valve opens, and the burners light with a soft whoosh. Flames fire down the heat exchanger tubes.",
        highlight: ["igniter", "gas-valve", "heat-exchanger"],
        running: false,
      },
      {
        title: "The flame sensor proves it — in 3 seconds",
        text:
          "A thin rod in the flame must report combustion within seconds or the board slams the gas valve shut. Light-then-die-then-retry (three tries → lockout) is the signature of this sensor needing its annual cleaning.",
        highlight: ["igniter", "control-board"],
        running: false,
      },
      {
        title: "The blower waits, then delivers",
        text:
          "The blower deliberately waits 30–60 seconds while the exchanger warms — this is why heat doesn't arrive the instant the furnace fires. Then it pushes air across the hot metal and warm air rides the same ducts and silver flex runs to every room.",
        highlight: ["blower", "heat-exchanger", "ductwork", "flex-duct"],
        running: true,
      },
      {
        title: "Satisfied — and the cool-down",
        text:
          "Set point reached, burners stop, and the blower keeps running until the exchanger cools. Air from the vents turning cool for the last minute of a cycle is normal harvest, not a failure — cold air for whole cycles is (see 'furnace blowing cold air' in the FAQ).",
        highlight: ["thermostat", "blower"],
        running: false,
      },
    ],
    verdict:
      "Pre-purge pause, ignition, 3-second flame proof, blower delay, cool-down harvest: five deliberate stages, three of which get reported as 'my furnace is broken.' Know the healthy rhythm and the real faults stand out immediately.",
  },
  {
    id: "heatpump-winter-day",
    kind: "healthy",
    title: "A heat pump on a 20°F day — including the defrost 'scare'",
    symptomSummary:
      "The healthy winter baseline for heat pumps: what continuous running, steam plumes, and brief AUX bursts look like when nothing is wrong.",
    steps: [
      {
        title: "Running all day IS the design",
        text:
          "Below the balance point (25–40°F outdoor), a heat pump runs long, nearly continuous cycles — moving 2–3 units of heat per unit of electricity the whole time. Gas-furnace intuition says 'it never shuts off, something's wrong.' Heat-pump reality: long runs at low output are exactly how it wins on efficiency.",
        highlight: ["compressor", "refrigerant-lines", "condenser-coil"],
        running: true,
      },
      {
        title: "Frost grows on the outdoor coil",
        text:
          "Pulling heat from 20°F air drives the outdoor coil below freezing, and humidity frosts onto it — a thin, even white coat is completely normal. The defrost sensor clamped to the coil watches it build.",
        highlight: ["condenser-coil", "defrost-sensor"],
        running: true,
      },
      {
        title: "The defrost cycle — the part that scares everyone",
        text:
          "Every 30–90 minutes the board flips the reversing valve: the system briefly runs in COOLING to heat the outdoor coil, the fan stops, a cloud of steam rolls off the unit, and it groans a bit. Indoors, the aux strips cover so the vents don't blow cold. Five minutes later it's back to heating. Steam plume + brief AUX = the system working, not failing.",
        highlight: ["reversing-valve", "control-board", "aux-heat-strips"],
        running: true,
      },
      {
        title: "AUX in bursts, not as a lifestyle",
        text:
          "On the coldest days the room may sag ~2°F below set point and stage the strips in for recovery bursts. Healthy pattern: AUX flickers on, catches up, drops out. The failure patterns are the extremes — AUX constantly lit on a mild day (stuck on, 3–5x bills) or never engaging during a cold snap while the house loses ground (strips dead).",
        highlight: ["thermostat", "aux-heat-strips", "outdoor-air-sensor"],
        running: true,
      },
      {
        title: "What's NOT normal in winter",
        text:
          "A solid ice SHELL on the outdoor unit for days (defrost failure), ice climbing the refrigerant lines with weak heat (low charge), steam-plume defrosts every few minutes (lying sensor), or supply air that never exceeds lukewarm in a cold snap (dead strips). Each of those is in the fault library below — everything you watched in this sequence is not.",
        highlight: ["condenser-coil", "refrigerant-lines", "aux-heat-strips"],
        running: true,
      },
    ],
    verdict:
      "Continuous low-and-slow running, light even frost, periodic steamy defrosts with brief AUX cover, and burst-mode aux on brutal days: that's a healthy heat pump winter. Memorize this rhythm and the two real failures — AUX stuck on (the 5x bill) and AUX dead (the cold-snap emergency) — stand out immediately.",
  },
  {
    id: "attic-pan",
    title: "The attic pan filled with water — and everything went dead",
    symptomSummary:
      "AC completely dead on a humid day. Up in the attic, the emergency pan under the unit is full of standing water.",
    faultId: "clogged-condensate",
    steps: [
      {
        title: "Humidity becomes water",
        text:
          "While cooling on a humid day, the evaporator coil wrings 5–20 gallons of water out of the air. Every drop has to leave through one narrow drain line — watch it drip at the outdoor outlet while the system runs.",
        highlight: ["evaporator-coil", "condensate-drain"],
        running: true,
        drip: true,
        panWater: 0,
      },
      {
        title: "The drain clogs, the pan fills",
        text:
          "Algae builds up in the drain line until water can't pass. It backs up into the primary pan, overflows into the emergency pan, and rises toward the float switch. Outside, the drain outlet has gone dry — the first clue nobody notices.",
        highlight: ["condensate-drain", "emergency-pan"],
        running: true,
        drip: false,
        panWater: 0.6,
      },
      {
        title: "The float switch pulls the plug",
        text:
          "The float lifts and opens the 24-volt control circuit — the same circuit the thermostat uses to call for cooling. The ENTIRE system goes silent: no blower, no outdoor fan, no error message. It looks like a dead AC. It's actually a safety device doing its job, protecting your ceiling.",
        highlight: ["float-switch", "emergency-pan", "thermostat"],
        running: false,
        panWater: 0.95,
        floatTripped: true,
      },
      {
        title: "Clear the water — it wakes right up",
        text:
          "Empty the pan and pull the clog (a wet/dry vac sealed on the outdoor drain stub works best). The float drops, the circuit closes, the thermostat's call gets through — blower spins up indoors, the outdoor fan kicks on. Nothing was ever 'broken.'",
        highlight: ["condensate-drain", "float-switch", "condenser-fan", "blower"],
        running: true,
        panWater: 0.12,
      },
      {
        title: "Confirm at the drain outlet",
        text:
          "The proof it's fixed: steady droplets at the outdoor drain termination while cooling on a humid day. Dripping drain = flowing drain. If it runs dry again within days, the clog is re-forming and the line needs a proper clean-out.",
        highlight: ["condensate-drain"],
        running: true,
        drip: true,
      },
    ],
    verdict:
      "A clogged condensate drain tripping the float switch — the #1 cause of 'my AC died on the hottest day' calls that end with a $0 fix. Prevention: vacuum the line each spring and a cup of distilled vinegar in the cleanout tee monthly in cooling season. One caution: a drain stub terminating over a window or soffit is the EMERGENCY line — dripping there is the warning, not the health check.",
  },
  {
    id: "hums-wont-start",
    title: "The outdoor unit hums, clicks… and never starts",
    symptomSummary:
      "Indoor blower runs and air moves, but it's warm. Outside, the unit buzzes for a few seconds, clicks off, and tries again — the fan on top never spins.",
    faultId: "failed-capacitor",
    steps: [
      {
        title: "The call goes out",
        text:
          "The thermostat calls for cooling. Indoors everything is normal — the blower runs and pushes air. But that air never gets cold, because cooling only happens if the outdoor unit joins in.",
        highlight: ["thermostat", "blower"],
        running: true,
      },
      {
        title: "Hum… click… silence",
        text:
          "At the outdoor unit: the contactor clicks in and power arrives, but the compressor and fan just hum without turning. After a few seconds their overload protection gives up. A pause, then it tries again. That hum is a motor pushing against a dead start circuit.",
        highlight: ["contactor", "capacitor", "compressor"],
        running: false,
      },
      {
        title: "The stick test",
        text:
          "The classic field check: nudge the fan blade with a stick through the top grille (never fingers). If the fan spins up and keeps going, the motors are fine — the run capacitor that gives them their starting kick is dead. A bulged or leaking capacitor top confirms it on sight.",
        highlight: ["condenser-fan", "capacitor"],
        running: false,
      },
      {
        title: "Why you stop running it",
        text:
          "Every failed start slams the compressor with locked-rotor current — the electrical equivalent of flooring a car in park. Shut cooling off until it's fixed. A capacitor is a $150–$400 pro visit; the compressor it protects is a $2,000+ one. (Capacitors hold a lethal charge after power-off — this is not the DIY one.)",
        highlight: ["capacitor", "compressor"],
        running: false,
      },
    ],
    verdict:
      "A failed run capacitor — the single most-replaced part in residential AC. Cheap, fast, and dangerous only if you open the panel yourself. Book the repair, keep the system off, and the compressor lives to see another decade.",
  },
  {
    id: "ice-in-july",
    title: "Ice on the copper line in the middle of July",
    symptomSummary:
      "Cooling has gotten weaker for days. Airflow at the vents is feeble, and there's frost — actual ice — on the big insulated copper line at the indoor unit.",
    faultId: "clogged-filter",
    steps: [
      {
        title: "The slow suffocation",
        text:
          "A filter that's months overdue chokes the return airflow. The blower moves less and less warm air across the evaporator coil — and a coil that isn't fed warm air runs colder and colder, past 32°F.",
        highlight: ["air-filter", "blower"],
        running: true,
      },
      {
        title: "Ice feeds on itself",
        text:
          "Moisture in the air freezes onto the cold coil instead of draining away. Ice blocks airflow further, which makes the coil colder, which makes more ice — until the coil is a solid block, frost creeps up the suction line, and almost no air leaves the vents.",
        highlight: ["evaporator-coil", "refrigerant-lines"],
        running: true,
      },
      {
        title: "Thaw first, always",
        text:
          "Cooling OFF, fan ON. Give it 2–4 hours (towels under the unit — that ice becomes water in the pan). Running it frozen risks liquid refrigerant slugging back into the compressor, which turns a $10 problem into a four-figure one.",
        highlight: ["thermostat", "condensate-drain"],
        running: false,
      },
      {
        title: "New filter, moment of truth",
        text:
          "Fresh filter in, cooling back on. Strong airflow returns and the lines stay dry: case closed, it was airflow all along. If ice comes back with a clean filter and a strong blower — the other thing that starves a coil is a refrigerant leak, and that one's a pro call.",
        highlight: ["air-filter", "evaporator-coil"],
        running: true,
        drip: true,
      },
    ],
    verdict:
      "A clogged air filter froze the coil — the most common self-inflicted failure in HVAC. The $10 rectangle you forgot protects the blower, the coil, and the compressor. Set a calendar reminder: 1-inch filters every 1–3 months.",
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

SCENARIOS.push({
  id: "5x-winter-bill",
  title: "The winter electric bill that hit 5x — with nothing 'broken'",
  symptomSummary:
    "All-electric heat pump home. House perfectly warm all winter, system quiet — and then a monthly electric bill 4–5x higher than comparable homes. A hired consultant eventually finds it.",
  faultId: "stuck-aux-heat",
  steps: [
    {
      title: "How a heat pump is supposed to heat",
      text:
        "In heating mode the refrigerant loop runs in reverse: the compressor moves heat from outdoor air into the house, delivering roughly 3 units of heat per unit of electricity. This is the cheap mode — the one you're supposed to live on.",
      highlight: ["compressor", "refrigerant-lines", "condenser-coil"],
      running: true,
    },
    {
      title: "The backup nobody should feel",
      text:
        "Inside the air handler sit auxiliary heat strips — pure electric resistance, glowing like a giant toaster. They exist for deep cold and defrost cycles, delivering 1 unit of heat per unit of electricity: 3–5x the cost per degree. Designed to run minutes, not months.",
      highlight: ["aux-heat-strips"],
      running: true,
    },
    {
      title: "A sensor board starts lying",
      text:
        "The defrost/control board reads the outdoor sensor to decide when strips are allowed. This one misreads — and latches auxiliary heat on. The strips now carry the load the compressor should. The house is warm. Nothing rattles, nothing leaks, no error code shows. The failure is completely silent.",
      highlight: ["control-board", "aux-heat-strips"],
      running: true,
    },
    {
      title: "The bill IS the symptom",
      text:
        "kWh usage runs 4–5x comparable homes. The one visible clue sits on the thermostat: AUX HEAT or EM HEAT lit on a mild afternoon, when a healthy system wouldn't dream of touching the strips. Most people never look.",
      highlight: ["thermostat", "aux-heat-strips"],
      running: true,
    },
    {
      title: "What the consultant actually did",
      text:
        "Clamp meter on the strip circuit: 40+ amps drawn during ordinary heating — strips running when they shouldn't. Board's sensor reading compared against a real thermometer: off by 25 degrees. Faulty sensor board replaced, aux lockout set above 35°F, and the next bill drops back to normal. The fix paid for itself in one cycle.",
      highlight: ["control-board"],
      running: true,
    },
  ],
  verdict:
    "A faulty defrost/sensor board latching emergency heat on — the most expensive failure a heat pump can have precisely because nothing feels broken. If your winter bill jumps 3–5x with an all-electric system: check the thermostat for a constantly-lit AUX/EM indicator, then have the sensor board and strip amp draw tested. $150–$650 in parts against hundreds per month in waste.",
});

/** Distinct system paths a fault touches, via its components. */
export function pathsForFault(fault: HvacFault): HvacPath[] {
  const seen = new Set<HvacPath>();
  fault.components.forEach((c) => {
    const comp = COMPONENTS.find((x) => x.id === c);
    if (comp) {
      seen.add(comp.path);
      comp.secondaryPaths?.forEach((p) => seen.add(p));
    }
  });
  return Array.from(seen);
}

/** All faults whose components touch a given path, most common first. */
export function faultsForPath(path: HvacPath): HvacFault[] {
  return FAULTS.filter((f) => pathsForFault(f).includes(path)).sort((a, b) => b.prior - a.prior);
}


/* ---------------------------------------------------------------- *
 *  Machine layer — the digital-twin surface.
 *  STATES formalizes the sequences the scenarios narrate; TELEMETRY
 *  registers the observable numbers with nominal ranges so a live
 *  system (or a robot) can bind sensors to the same ontology the
 *  humans use. Faults carry oemCodeHints for board-code mapping.
 * ---------------------------------------------------------------- */

export interface HvacState {
  id: string;
  label: string;
  /** Typical dwell time or trigger, human units. */
  timing: string;
  /** Components active in this state. */
  active: string[];
  next: string[];
}

export const COOLING_STATES: HvacState[] = [
  { id: "idle", label: "Idle — energized, waiting", timing: "until thermostat calls", active: ["transformer", "thermostat"], next: ["cool-call"] },
  { id: "cool-call", label: "Cooling call (Y+G close)", timing: "instant", active: ["thermostat", "control-board"], next: ["safety-check"] },
  { id: "safety-check", label: "Safety chain verification", timing: "<1s", active: ["control-board", "float-switch", "blower-door-switch"], next: ["condenser-start", "locked-out"] },
  { id: "condenser-start", label: "Contactor in, capacitor kick", timing: "1–3s", active: ["contactor", "capacitor", "compressor", "condenser-fan"], next: ["cooling"] },
  { id: "cooling", label: "Steady cooling + dehumidification", timing: "10–20 min healthy cycle", active: ["compressor", "condenser-fan", "blower", "evaporator-coil", "condensate-drain"], next: ["satisfied", "locked-out"] },
  { id: "satisfied", label: "Set point reached — blower harvest", timing: "60–90s blower overrun", active: ["blower"], next: ["anti-cycle"] },
  { id: "anti-cycle", label: "Anti-short-cycle delay", timing: "5 min", active: [], next: ["idle"] },
  { id: "locked-out", label: "Safety lockout (float/pressure/limit)", timing: "until cleared", active: [], next: ["idle"] },
];

export const HEATING_STATES: HvacState[] = [
  { id: "idle", label: "Idle", timing: "until thermostat calls", active: ["transformer", "thermostat"], next: ["heat-call"] },
  { id: "heat-call", label: "Heat call (W closes)", timing: "instant", active: ["thermostat", "control-board"], next: ["pre-purge"] },
  { id: "pre-purge", label: "Inducer pre-purge + draft proof", timing: "30–60s", active: ["inducer-fan"], next: ["ignition", "locked-out"] },
  { id: "ignition", label: "Igniter glow → gas valve opens", timing: "17–45s warm-up", active: ["igniter", "gas-valve"], next: ["flame-proof"] },
  { id: "flame-proof", label: "Flame sensor must prove", timing: "within ~3s", active: ["igniter", "heat-exchanger"], next: ["heating", "retry"] },
  { id: "retry", label: "Failed proof — retry", timing: "3 tries then lockout", active: ["control-board"], next: ["pre-purge", "locked-out"] },
  { id: "heating", label: "Blower delay, then steady heat", timing: "30–60s delay; cycle 10–20 min", active: ["blower", "heat-exchanger", "ductwork"], next: ["cool-down"] },
  { id: "cool-down", label: "Burners off, blower harvests", timing: "60–120s", active: ["blower"], next: ["idle"] },
  { id: "locked-out", label: "Board lockout (code flashing)", timing: "1hr auto-retry or manual reset", active: ["control-board"], next: ["idle"] },
];

export interface TelemetryPoint {
  id: string;
  label: string;
  unit: string;
  nominal: string;
  faultSignal: string;
  component: string;
}

export const TELEMETRY: TelemetryPoint[] = [
  { id: "supply-return-delta", label: "Supply/return temperature split (cooling)", unit: "°F", nominal: "18–22", faultSignal: "<14 = low charge or dirty coil; >24 = weak airflow", component: "evaporator-coil" },
  { id: "coil-temp", label: "Evaporator coil temperature", unit: "°F", nominal: "~40", faultSignal: "<32 = icing conditions (airflow or charge)", component: "evaporator-coil" },
  { id: "suction-pressure", label: "Suction pressure (R-410A, cooling)", unit: "psi", nominal: "115–140", faultSignal: "low+low head = leak; low+high superheat = starved", component: "service-valves" },
  { id: "head-pressure", label: "Liquid/head pressure (R-410A, 90°F day)", unit: "psi", nominal: "350–420", faultSignal: "high+high subcool = overcharge/blocked condenser", component: "service-valves" },
  { id: "superheat", label: "Superheat", unit: "°F", nominal: "8–15", faultSignal: "high = starved coil; near-0 = flooding (slugging risk)", component: "txv" },
  { id: "subcool", label: "Subcooling", unit: "°F", nominal: "8–12", faultSignal: "low = undercharge; high = overcharge/restriction", component: "service-valves" },
  { id: "strip-supply-temp", label: "Supply air with aux strips engaged", unit: "°F", nominal: "105–125", faultSignal: "strip-range air on a mild day = aux stuck on", component: "aux-heat-strips" },
  { id: "hp-supply-temp", label: "Supply air, heat pump alone (heating)", unit: "°F", nominal: "90–100", faultSignal: "lukewarm in a cold snap + losing ground = strips dead", component: "aux-heat-strips" },
  { id: "strip-amps", label: "Aux strip circuit draw when staged", unit: "A", nominal: "20–60 by bank", faultSignal: "draw during ordinary mild-day heating = stuck aux", component: "aux-heat-strips" },
  { id: "board-fuse", label: "Control board blade fuse", unit: "A", nominal: "3–5", faultSignal: "repeat blows = 24V field short (check outdoor wires)", component: "control-board" },
  { id: "defrost-interval", label: "Defrost cycle interval (below 40°F)", unit: "min", nominal: "30–90", faultSignal: "minutes apart = lying sensor; never = ice-block failure", component: "defrost-sensor" },
  { id: "cycle-length", label: "Run cycle length", unit: "min", nominal: "10–20", faultSignal: "<5 = short cycling (see airflow/pressure/control causes)", component: "thermostat" },
];

/* ---------------------------------------------------------------- *
 *  Lookups & the ranking traversal
 * ---------------------------------------------------------------- */

export const componentById = (id: string) => COMPONENTS.find((c) => c.id === id);
export const symptomById = (id: string) => SYMPTOMS.find((s) => s.id === id);

export const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  diy: { label: "DIY-friendly", color: "#34d399" },
  pro: { label: "Call a pro", color: "#fbbf24" },
  urgent: { label: "Safety — act now", color: "#f87171" },
};

export interface RankedFault {
  fault: HvacFault;
  score: number;
  matched: string[];
}

/**
 * Score faults against a set of observed symptoms.
 * Blends precision (how much of the fault's signature you observed),
 * recall (how much of what you observed this fault explains), and a
 * real-world prior for how common the fault is.
 */
export function rankFaults(selectedSymptoms: string[], systemType?: "gas" | "heatpump"): RankedFault[] {
  // Emergency chips (gas smell, CO alarm) bypass ranking entirely — the UI
  // shows evacuate-first guidance instead of a fault list.
  const scored = selectedSymptoms.filter((id) => !symptomById(id)?.emergency);
  if (scored.length === 0) return [];
  const sel = new Set(scored);

  return FAULTS.map((fault) => {
    if (systemType && fault.appliesTo && fault.appliesTo !== systemType) return null;
    const matched = fault.symptoms.filter((s) => sel.has(s));
    if (matched.length === 0) return null;
    // Damp precision for narrow-signature faults so one shared symptom can't
    // rank a 1-symptom fault above broad, common ones.
    const damp = Math.min(1, fault.symptoms.length / 3);
    const precision = (matched.length / fault.symptoms.length) * damp;
    const recall = matched.length / sel.size;
    const prior = fault.prior / 10;
    return { fault, matched, score: 0.3 * precision + 0.35 * recall + 0.35 * prior };
  })
    .filter((r): r is RankedFault => r !== null)
    .sort((a, b) => b.score - a.score);
}

/** UI tier for a rank score — honest wording instead of fake probabilities. */
export function scoreTier(score: number): { label: string; strong: boolean } {
  if (score >= 0.62) return { label: "Strong fit", strong: true };
  if (score >= 0.45) return { label: "Possible", strong: false };
  return { label: "Weak signal", strong: false };
}

/** All faults that implicate a given component — used by the explore panel. */
export function faultsForComponent(componentId: string): HvacFault[] {
  return FAULTS.filter((f) => f.components.includes(componentId)).sort((a, b) => b.prior - a.prior);
}
