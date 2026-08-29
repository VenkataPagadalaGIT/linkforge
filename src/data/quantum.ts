/**
 * quantum.ts: the "How Quantum Computers Work" guide's single source of truth.
 *
 * Every number and every historical claim in this file traces to
 * docs/research/quantum-computer-explainer-kb.md, a two-phase knowledge base:
 * seven research agents anchored on primary sources (Nielsen & Chuang, Krantz
 * et al. 2019, Koch et al. 2007, the Google Willow paper, vendor engineering
 * docs), then seven hostile-referee verification agents. Nothing here is from
 * memory. If a fact needs to change, change the KB first.
 *
 * The one error this guide refuses to make: a quantum computer does not "try
 * every answer at once". Amplitudes over 2^n states are not 2^n computations,
 * and measurement returns one outcome. Interference is the whole trick.
 */

export type QcAct = "physics" | "machine" | "program" | "hard";

export interface QcActMeta {
  id: QcAct;
  label: string;
  color: string;
  blurb: string;
}

export const QC_ACTS: Record<QcAct, QcActMeta> = {
  physics: {
    id: "physics",
    label: "Act I: A different kind of bit",
    color: "#38bdf8",
    blurb:
      "A classical bit is a switch. A qubit is a direction in an abstract space, written in two complex numbers you can steer but never read directly. Superposition, entanglement, and the one rule everything else obeys: measurement gives one answer.",
  },
  machine: {
    id: "machine",
    label: "Act II: The machine",
    color: "#fbbf24",
    blurb:
      "The golden chandelier is a refrigerator. Six plates step from room temperature down to a hundredth of a degree above absolute zero, and at the bottom hangs a chip whose circuits stop having electrical resistance at all.",
  },
  program: {
    id: "program",
    label: "Act III: A program runs",
    color: "#a78bfa",
    blurb:
      "A circuit becomes microwave pulses, pulses become rotations, rotations choreograph interference so wrong answers cancel and right answers reinforce, and one readout tone comes back carrying a single bit.",
  },
  hard: {
    id: "hard",
    label: "Act IV: The hard part",
    color: "#34d399",
    blurb:
      "The environment is always listening, and listening destroys quantum states. Error correction knits many fragile physical qubits into one tougher logical qubit. That is the whole race, and the honest scoreboard.",
  },
};

export interface QcStage {
  id: string;
  name: string;
  /** Short label drawn in the 3D scene. */
  short: string;
  act: QcAct;
  tagline: string;
  /** Plain-English story: what actually happens here. */
  story: string;
  /** The precise technical mechanism. */
  tech: string;
  /** A physical-world analogy. */
  analogy: string;
  /** Real, source-verified figures. */
  numbers: { label: string; value: string }[];
  /** The primary source behind this stage, verified in the KB. */
  paper?: string;
}

export const QC_STAGES: QcStage[] = [
  /* ---------------- ACT I : A DIFFERENT KIND OF BIT ---------------- */
  {
    id: "bit",
    name: "Bit vs Qubit",
    short: "bit vs qubit",
    act: "physics",
    tagline: "A switch, and then a direction",
    story:
      "Everything classical computing has ever done runs on switches that are either off or on, 0 or 1. A qubit is built from something physical too, the two lowest energy levels of a tiny circuit, a single trapped ion, one atom. But between preparation and measurement it is not forced to be either level. Its state is a weighted blend of both, and the weights are the program's raw material.",
    tech:
      "A qubit state is |psi> = a|0> + b|1>, where a and b are complex amplitudes with |a|^2 + |b|^2 = 1. The squared magnitudes are the probabilities of measuring 0 or 1; the relative phase between a and b has no classical counterpart and is what interference acts on.",
    analogy:
      "A coin on a table is heads or tails. A qubit is a coin still spinning, except the spin has a direction you can steer, and two spinning coins can be linked so they land together.",
    numbers: [
      { label: "Classical bit states", value: "2, occupied one at a time" },
      { label: "Qubit description", value: "2 complex amplitudes" },
      { label: "Amplitude rule", value: "|a|² + |b|² = 1" },
    ],
    paper: "Nielsen & Chuang, Quantum Computation and Quantum Information (2000)",
  },
  {
    id: "superposition",
    name: "Superposition, Honestly",
    short: "2ⁿ amplitudes",
    act: "physics",
    tagline: "Amplitudes are not parallel computers",
    story:
      "Here is the most misquoted fact in the field. A register of n qubits is described by 2^n amplitudes, and for 300 qubits that is more numbers than there are atoms in the observable universe. The pop-science leap is 'so it computes all answers at once'. It does not. When you measure, you get one outcome, sampled by the amplitudes. All the cleverness of quantum algorithms is in making the wrong outcomes cancel before that single sample is taken.",
    tech:
      "n qubits live in a 2^n-dimensional complex vector space; a general state assigns an amplitude to every basis string. Gates transform all amplitudes simultaneously and reversibly, but the Born rule pays out exactly one string per measurement, with probability equal to the squared amplitude.",
    analogy:
      "Not a warehouse of 2^n calculators. Closer to a wave tank: one wave holds the whole pattern at once, and the skill is arranging ripples so they pile up only where the answer is.",
    numbers: [
      { label: "Amplitudes at n = 300", value: "2³⁰⁰ ≈ 10⁹⁰" },
      { label: "Answers per measurement", value: "exactly 1" },
      { label: "Why algorithms work", value: "interference, not parallelism" },
    ],
    paper: "Aaronson, Quantum Computing Since Democritus; Preskill lecture notes",
  },
  {
    id: "bloch",
    name: "The Bloch Sphere",
    short: "Bloch sphere",
    act: "physics",
    tagline: "Every single-qubit state is a point on a globe",
    story:
      "One qubit's every possible state maps to a point on a sphere. North pole is |0>, south pole is |1>, and the whole equator is equal 0-and-1 blends that differ only in phase. Quantum gates stop being mysterious here: every one-qubit gate is just a rotation of this globe, and a microwave pulse of the right frequency and duration performs exactly that rotation.",
    tech:
      "Up to an unobservable global phase, |psi> = cos(theta/2)|0> + e^(i phi) sin(theta/2)|1>, so (theta, phi) are latitude and longitude. Pauli X, Y, Z gates are half-turns about the three axes; the Hadamard is a half-turn about a diagonal axis, carrying a pole to the equator.",
    analogy:
      "A globe where Helsinki and every other city is a legal state. Gates are hands that spin the globe by exact angles. Measurement asks one blunt question: northern or southern hemisphere?",
    numbers: [
      { label: "Poles", value: "|0> north, |1> south" },
      { label: "Equator", value: "equal superpositions, phase varies" },
      { label: "Any 1-qubit gate", value: "a rotation of the sphere" },
    ],
    paper: "Bloch (1946); standard treatment in Nielsen & Chuang ch. 1",
  },
  {
    id: "entangle",
    name: "Entanglement",
    short: "entanglement",
    act: "physics",
    tagline: "Two qubits, one inseparable description",
    story:
      "Put two qubits through the right two-qubit gate and they stop having individual states at all. The pair (|00> + |11>)/sqrt(2) is a fifty-fifty bet on 00 or 11, and nothing else: measure one qubit and the other's outcome is fixed, instantly, at any distance. Einstein hated this. Experiments keep confirming it. It sends no signal, because neither side can choose the outcome, but it is the resource that makes a register more than the sum of its qubits.",
    tech:
      "A state is entangled when it cannot be written as a product of one-qubit states. Bell states are the maximal two-qubit case, produced by a Hadamard followed by a CNOT. Correlations violate Bell inequalities, ruling out local hidden variables; the 2022 Nobel Prize recognized the experiments.",
    analogy:
      "Two coins minted so that, however far apart they are flipped, they always agree. Not because either 'knows', but because there was only ever one coin-pair state, never two separate coins.",
    numbers: [
      { label: "Bell state", value: "(|00> + |11>)/√2" },
      { label: "Faster-than-light signalling", value: "none, provably" },
      { label: "Bell test Nobel", value: "2022 (Aspect, Clauser, Zeilinger)" },
    ],
    paper: "Bell (1964); Aspect et al. (1982)",
  },

  /* ---------------- ACT II : THE MACHINE ---------------- */
  {
    id: "chandelier",
    name: "The Golden Chandelier",
    short: "dilution fridge",
    act: "machine",
    tagline: "It is a refrigerator, and the computer hangs at the bottom",
    story:
      "The famous golden chandelier is what a dilution refrigerator looks like with its vacuum cans removed. Each gold-plated copper plate is a temperature floor, colder than the one above, and the actual quantum chip hangs in shielding beneath the lowest plate at about ten to twenty thousandths of a degree above absolute zero. Everything else, the tubes, the coils, the hundreds of cables, exists to get signals down to that chip and back out without carrying heat or noise along.",
    tech:
      "A pulse tube cryocooler provides two stages near 50 K and 4 K without liquid cryogens. Below that, a helium-3/helium-4 dilution unit takes over: He-3 crossing the phase boundary into the dilute phase absorbs heat, cooling the still (~0.9 K), cold plate (~0.1 K) and mixing chamber (~0.01 K) in series.",
    analogy:
      "A six-story building where each floor is a hundred times quieter than a library, and the tenant in the basement is so sensitive that a single stray photon counts as a shout.",
    numbers: [
      { label: "Mixing chamber", value: "~10-20 mK" },
      { label: "Deep space (CMB)", value: "2.7 K, ~150x warmer" },
      { label: "Cooldown to base", value: "under 24 h (empty fridge, vendor spec)" },
    ],
    paper: "Krantz et al. (2019), A Quantum Engineer's Guide, arXiv:1904.06560",
  },
  {
    id: "cold",
    name: "Why So Cold",
    short: "temperature ladder",
    act: "machine",
    tagline: "Heat is randomness, and randomness is the enemy",
    story:
      "A superconducting qubit's two levels are separated by an energy so small that ordinary warmth would scramble it constantly. At room temperature the environment would kick the qubit between its states billions of times a second. Cool the chip until thermal energy is far below the level spacing and the qubit finally sits still in its ground state, waiting to be told what to do. Cold is also what makes the circuits superconduct, so current flows with zero resistance and no dissipative noise of its own.",
    tech:
      "Qubit transition frequencies sit near 4-8 GHz, an energy of about 0.2-0.4 microelectronvolts. For thermal occupation of the excited state to be negligible, k_B T must be well below h f, which demands T of tens of millikelvin. Aluminum films superconduct below about 1.2 K; niobium below 9.3 K.",
    analogy:
      "Trying to hear a pin drop in a stadium. You cannot amplify the pin; you can only empty the stadium. Millikelvin is what an empty stadium costs.",
    numbers: [
      { label: "Qubit frequency", value: "~4-8 GHz" },
      { label: "50 K / 4 K / still / CP / MXC", value: "the five cold floors" },
      { label: "Thermal photons at 15 mK", value: "effectively zero at 5 GHz" },
    ],
    paper: "Krantz et al. (2019), section on cryogenic setup",
  },
  {
    id: "wiring",
    name: "Signals Down, Whispers Up",
    short: "wiring & amps",
    act: "machine",
    tagline: "Attenuate everything going down, amplify everything coming up",
    story:
      "Control pulses are born in room-temperature electronics, which means they arrive carrying room-temperature noise. So the drive lines deliberately throw most of the signal away: attenuators bolted to each plate bleed off the noise as heat where the fridge can absorb it. The readout signal has the opposite problem. It leaves the chip almost unmeasurably faint and must be amplified in stages: first by a quantum-limited parametric amplifier at the coldest plate, then by a transistor amplifier at 4 K, before room-temperature electronics digitize it.",
    tech:
      "Drive lines typically distribute ~60 dB of attenuation across the stages so thermal noise is thermalized at each plate. The return path runs through circulators (one-way valves for microwaves) into a TWPA adding 20-30 dB near the quantum limit, then a HEMT at 4 K adding ~40 dB, with superconducting NbTi cable in between so nothing is lost.",
    analogy:
      "Shouting down a canyon through foam baffles so only a clean whisper reaches the bottom, then relaying the reply back up through two megaphones that add almost no hiss of their own.",
    numbers: [
      { label: "Drive-line attenuation", value: "~60 dB total, distributed" },
      { label: "50-qubit processor wiring", value: "124 RF lines (Krinner et al.)" },
      { label: "TWPA gain at ~10 mK", value: "20-30 dB, near quantum limit" },
      { label: "HEMT gain at 4 K", value: "~+40 dB" },
    ],
    paper: "Macklin et al. (2015), Science; Krantz et al. (2019)",
  },
  {
    id: "chip",
    name: "The Chip Itself",
    short: "transmon chip",
    act: "machine",
    tagline: "A capacitor, a weird inductor, and nothing else",
    story:
      "Under the shields sits a chip that would not look out of place in a classical fab: aluminum patterns on silicon or sapphire. Each qubit is an LC oscillator with one exotic ingredient, a Josephson junction, two aluminum superconductors separated by an ultrathin aluminum-oxide barrier. Electrons tunnel through it as pairs, and that tunneling makes the oscillator nonlinear: its energy levels are unevenly spaced, so the bottom two can be addressed as |0> and |1> without accidentally exciting the third.",
    tech:
      "The transmon is a Josephson junction shunted by a large capacitor, operated where charge noise is exponentially suppressed. Anharmonicity is typically -200 to -300 MHz. Each qubit couples to its own readout resonator; drive, flux and readout lines reach the die through wirebonds or bump bonds from the package.",
    analogy:
      "A guitar string whose frets are deliberately uneven, so the lowest two notes are far enough from the third that you can play them cleanly without ever sounding it.",
    numbers: [
      { label: "Junction", value: "Al/AlOx/Al, ultrathin oxide barrier" },
      { label: "Anharmonicity", value: "~ -200 to -300 MHz" },
      { label: "Modern T1", value: "order 100 µs (device median)" },
    ],
    paper: "Koch et al. (2007), the transmon paper, arXiv:cond-mat/0703002",
  },
  {
    id: "platforms",
    name: "Other Ways to Build a Qubit",
    short: "ions & atoms",
    act: "machine",
    tagline: "The chandelier is one answer, not the answer",
    story:
      "Trapped-ion machines hold charged atoms in radio-frequency electric fields inside an ultra-high vacuum, and drive gates with lasers; their qubits are nearly identical by nature and their fidelities are the best in the field, but gates run roughly a thousand times slower than superconducting ones. Neutral-atom machines hold arrays of atoms in optical tweezers and entangle them through Rydberg states, scaling to thousands of atoms. Photonic machines encode qubits in light itself. Nobody knows which platform wins; the honest answer is that the race is live.",
    tech:
      "Ions: Paul traps, Yb-171 or Ca-40, gates via shared motional modes (Cirac-Zoller 1995, Molmer-Sorensen 1999), two-qubit fidelities above 99.9% demonstrated. Atoms: optical tweezers plus Rydberg blockade, thousands of traps shown. Photonics: fusion-based schemes, room temperature except superconducting single-photon detectors.",
    analogy:
      "Three ways to build an orchestra: superconducting circuits are electric instruments, fast and loud but temperamental; ions are a string quartet, slow and nearly perfect; atoms are a choir you can reseat mid-performance.",
    numbers: [
      { label: "Ion 2-qubit fidelity", value: ">99.9% (best published)" },
      { label: "Ion vacuum", value: "below ~10⁻¹¹ mbar" },
      { label: "Neutral-atom arrays", value: "1,000+ traps demonstrated" },
    ],
    paper: "Cirac & Zoller (1995); Molmer & Sorensen (1999)",
  },

  /* ---------------- ACT III : A PROGRAM RUNS ---------------- */
  {
    id: "compile",
    name: "From Circuit to Pulses",
    short: "compiler",
    act: "program",
    tagline: "Your algorithm becomes rotations a chip can actually do",
    story:
      "You write a quantum program as a circuit: qubits as horizontal wires, gates as boxes. The hardware cannot run most of those boxes directly. A compiler decomposes every gate into the machine's small native set, then confronts the floor plan problem: on a real chip each qubit talks only to its neighbors, so when the circuit wants two distant qubits to interact, the compiler inserts SWAP gates to walk their states together. Then everything becomes a pulse schedule, timed to the nanosecond.",
    tech:
      "Any circuit compiles to single-qubit rotations plus one entangling gate (CNOT or CZ), a universal set. Routing on constrained topologies such as IBM's heavy-hex inserts SWAPs, each costing three CNOTs, so compilers optimize hard to minimize depth, since idle time is decoherence spent for nothing.",
    analogy:
      "Sheet music arranged for the instruments actually in the room, then rewritten again so musicians who must play a duet are seated next to each other.",
    numbers: [
      { label: "Universal set", value: "1-qubit rotations + CNOT" },
      { label: "One SWAP costs", value: "3 CNOTs" },
      { label: "Pulse timing", value: "nanosecond resolution" },
    ],
    paper: "Nielsen & Chuang ch. 4; Qiskit transpiler documentation",
  },
  {
    id: "pulse",
    name: "A Gate Is a Pulse",
    short: "microwave gate",
    act: "program",
    tagline: "Twenty nanoseconds of shaped microwave = one rotation",
    story:
      "Down in the fridge, a gate is not a box, it is an event. A microwave burst at the qubit's own frequency, shaped like a smooth bell and lasting tens of nanoseconds, drives the qubit's state around the Bloch sphere by exactly the angle the compiler asked for. Hold the pulse twice as long, rotate twice as far. Two-qubit gates are choreographed the same way, using a coupler or a cross-resonance drive so one qubit's rotation becomes conditional on its neighbor.",
    tech:
      "Resonant Rabi driving: pulse area sets rotation angle; Gaussian envelopes with DRAG correction suppress leakage to the third level. Single-qubit gates run ~10-40 ns with errors near 0.01-0.1%; two-qubit CZ or cross-resonance gates run ~30-200 ns with the best errors near 0.1-0.3%.",
    analogy:
      "Pushing a child on a swing: push at the swing's own rhythm and tiny taps add up to a big arc. The pulse is a burst of perfectly timed taps, and its length decides how far the swing goes.",
    numbers: [
      { label: "1-qubit gate", value: "~10-40 ns" },
      { label: "2-qubit gate", value: "~30-200 ns" },
      { label: "Best 2-qubit error", value: "~0.1-0.3%" },
    ],
    paper: "Motzoi et al. (2009), DRAG; Krantz et al. (2019)",
  },
  {
    id: "interference",
    name: "Interference Does the Work",
    short: "interference",
    act: "program",
    tagline: "Wrong answers cancel, right answers reinforce",
    story:
      "This station is the entire secret. A quantum algorithm routes amplitude along many computational paths at once, and paths carry phase. Where two paths reach the same wrong outcome with opposite phase, they annihilate. Where paths agree, they add. Shor's algorithm and Grover's search are, at bottom, interference patterns engineered so that by measurement time, nearly all the amplitude is piled on the answer. No cleverness at readout can rescue a circuit that failed to arrange this; the choreography is the computation.",
    tech:
      "Amplitudes are complex, so they cancel as waves do. Grover's operator rotates the state a calibrated angle per iteration toward the marked item, giving a provably optimal quadratic speedup; Shor's period-finding uses the quantum Fourier transform to make only the true period survive interference.",
    analogy:
      "Noise-canceling headphones for wrong answers: generate every possibility, then engineer the echoes so falsehoods arrive out of phase with themselves and silence each other.",
    numbers: [
      { label: "Grover speedup", value: "√N queries, provably optimal" },
      { label: "Shor vs best classical", value: "polynomial vs superpolynomial" },
      { label: "Rescue at readout", value: "impossible; interference or nothing" },
    ],
    paper: "Grover (1996); Shor (1994)",
  },
  {
    id: "readout",
    name: "Measurement",
    short: "readout",
    act: "program",
    tagline: "One microwave echo, one bit",
    story:
      "To read a superconducting qubit you never touch it directly. Each qubit sits next to its own small resonator, and the qubit's state pulls that resonator's pitch slightly sharp or flat. Send a probe tone through, and the echo comes back with a phase shift that depends on whether the qubit was |0> or |1>. After amplification, the electronics plot each echo as a point on a plane; the points fall into two clouds, and a line between the clouds turns physics into a classical bit.",
    tech:
      "Dispersive readout: the qubit-resonator coupling shifts the resonator by +/- chi depending on qubit state. Integration of the returned IQ waveform discriminates the state in tens to a few hundred nanoseconds at around 99% fidelity (99.2% in 88 ns demonstrated); the measurement also projects the qubit, collapsing superposition, which is why readout is the last act.",
    analogy:
      "Tapping a wine glass next to a sleeping cat. You never touch the cat; you hear whether the glass rings sharp or flat because of how the cat is lying.",
    numbers: [
      { label: "Readout time", value: "tens to a few hundred ns" },
      { label: "Assignment fidelity", value: "~99% (98.25% in 48 ns shown)" },
      { label: "What collapses", value: "the measured qubit's superposition" },
    ],
    paper: "Blais et al. (2004), circuit QED; Krantz et al. (2019)",
  },

  /* ---------------- ACT IV : THE HARD PART ---------------- */
  {
    id: "decoherence",
    name: "Decoherence",
    short: "T1 & T2",
    act: "hard",
    tagline: "The environment measures you whether you like it or not",
    story:
      "Every quantum state is perishable. Stray photons, vibrations, cosmic rays, even the wiring itself: anything that learns about the qubit's state destroys its superposition, exactly as a deliberate measurement would. Two clocks tick against every program. T1 is how long before an excited qubit relaxes and its energy leaks away. T2 is how long before the delicate phase relationship, the thing interference depends on, is scrambled. Every gate spent is coherence budget spent.",
    tech:
      "T1 is energy relaxation; T2 is total dephasing, with T2 <= 2*T1 as a hard bound. Modern planar transmons reach T1 and T2 of order 100 microseconds; against ~30 ns gates that allows a few thousand operations before the state is mush. This budget, not qubit count, is the binding constraint of the noisy era.",
    analogy:
      "Writing on a beach as the tide comes in. T1 is the waves erasing whole letters; T2 is the sand blurring while the words technically remain.",
    numbers: [
      { label: "T1, T2 today", value: "order 100 µs (transmons)" },
      { label: "Hard bound", value: "T2 ≤ 2·T1" },
      { label: "Ops per coherence window", value: "a few thousand" },
    ],
    paper: "Krantz et al. (2019); device papers per platform",
  },
  {
    id: "qec",
    name: "Error Correction",
    short: "logical qubits",
    act: "hard",
    tagline: "Many fragile qubits, one tougher one",
    story:
      "You cannot photocopy a quantum state, so you cannot back it up. The escape is to spread one logical qubit across many physical qubits and repeatedly ask delicate stabilizer questions that reveal where an error happened without revealing the data itself. A classical decoder races to interpret that stream and track corrections. In late 2024 Google's Willow chip crossed the line the field had chased for thirty years: making the code bigger made the logical qubit better, not worse. Error correction stopped being theory that year.",
    tech:
      "Surface code: data and ancilla qubits on a grid, syndrome extraction every microsecond or so, minimum-weight matching or faster decoders keeping pace in real time. Willow (105 qubits) showed error suppression factor ~2 per distance step from d=3 to d=7, the below-threshold regime. Corrections are mostly tracked in software as a Pauli frame rather than applied as physical pulses.",
    analogy:
      "A choir singing one note. Ask pairs of singers whether they agree, never anyone for the note itself, and you can find and fix the one who drifted without ever hearing, and thus disturbing, the note.",
    numbers: [
      { label: "Willow error suppression", value: "~2.1x per distance step" },
      { label: "Syndrome cycle", value: "~1 µs (superconducting)" },
      { label: "Overhead", value: "hundreds-to-thousands physical per logical" },
    ],
    paper: "Google Quantum AI, Nature (2024), the Willow below-threshold paper",
  },
  {
    id: "reality",
    name: "What They're Actually For",
    short: "the scoreboard",
    act: "hard",
    tagline: "Provable speedups are rare, and that is fine",
    story:
      "The honest scoreboard: quantum computers will not speed up most computation. The proven wins are specific. Simulating quantum systems themselves, which is chemistry and materials, was the original point and remains the best bet. Factoring, which breaks RSA, is proven but needs fault-tolerant machines with millions of physical qubits, which is why cryptography is migrating now. Unstructured search gets a quadratic boost only. Optimization and machine learning speedups remain unproven hopes. Anyone selling more than this is selling.",
    tech:
      "Shor on RSA-2048 needs roughly 20 million noisy physical qubits by the standard estimate (Gidney-Ekera 2019); the flagship error-corrected chip of 2024 holds 105. Roadmaps target hundreds of logical qubits around the end of the decade. Meanwhile NISQ-era devices run error-mitigated experiments at the edge of classical simulability, with no commercial advantage yet demonstrated.",
    analogy:
      "A wind tunnel, not a faster office computer. Useless for spreadsheets, irreplaceable for the specific physics it natively speaks, and the physics it speaks best is quantum physics itself.",
    numbers: [
      { label: "RSA-2048 estimate", value: "~20M noisy qubits (2019 est.)" },
      { label: "Flagship QEC chip, 2024", value: "105 qubits (Willow)" },
      { label: "Proven exponential wins", value: "few: simulation, factoring-class" },
    ],
    paper: "Preskill (2018), NISQ, arXiv:1801.00862; Gidney & Ekera (2019)",
  },
];

export interface QcJourneyStep {
  id: string;
  stageId: string;
  title: string;
  narration: string;
  program: string;
  /** Overrides the act label shown in the journey panel. The opening wide
   *  shot is a Prologue: it previews the machine before Act I starts, so it
   *  should not read as "Act II" ahead of Act I. */
  actLabel?: string;
}

export const QC_JOURNEY: QcJourneyStep[] = [
  {
    id: "q-chandelier",
    stageId: "chandelier",
    actLabel: "Prologue",
    title: "Meet the whole machine",
    narration:
      "Before we go inside, here is the whole thing. This golden chandelier is really a refrigerator hanging upside down: six floors, each colder than the last, and at the very bottom, inside those shields, a chip the size of your thumbnail. Almost all of this metal exists for one job, keeping that chip cold and still. We will start with the smallest thing on it, a single qubit, and build up from there.",
    program: "chandelier",
  },
  {
    id: "q-bit",
    stageId: "bit",
    title: "A switch becomes a sphere",
    narration:
      "Start with what you know: a bit, a switch, off or on. Now watch the switch melt into a globe. A qubit can point anywhere on this sphere, and the two poles are the old 0 and 1. Everything strange about quantum computing begins with the space between the poles.",
    program: "bit",
  },
  {
    id: "q-superposition",
    stageId: "superposition",
    title: "What superposition really buys",
    narration:
      "Four qubits, sixteen amplitude bars. The register now holds a weight for every possible four-bit string at the same time, and n qubits hold 2 to the n of these weights. That sounds like enormous parallel storage, and in a sense it is. But hold one thought before the next beat: these weights are not answers you can read out. They are raw material.",
    program: "superposition",
  },
  {
    id: "q-collapse",
    stageId: "superposition",
    title: "You only get one bit out",
    narration:
      "Here is the catch that kills the myth. The instant you measure the register, the whole blend collapses: one bar wins, every other vanishes, and all you get back is a single ordinary string of 0s and 1s. You never see the weights themselves. So a quantum computer is not a machine that checks every answer at once and hands you the right one. You get one look, and one plain answer. The entire art is arranging those weights beforehand so the answer you want is the one most likely to survive the look.",
    program: "superposition",
  },
  {
    id: "q-bloch",
    stageId: "bloch",
    title: "Gates are rotations",
    narration:
      "One qubit, up close. The arrow is its state. Watch a Hadamard carry the north pole to the equator, an X gate flip it through, a Z gate spin the phase. Every single-qubit gate ever invented is a rotation of this globe by an exact angle. Remember that; in a moment you will see what performs the rotation physically.",
    program: "bloch",
  },
  {
    id: "q-entangle",
    stageId: "entangle",
    title: "Two qubits, one fate",
    narration:
      "Two qubits pass through an entangling gate and stop being individuals. Their spheres dim, because neither has a state of its own anymore; only the pair does. Measure one and both meters snap together, every time, at any distance. No message travels. The correlation was manufactured here, in the gate.",
    program: "entangle",
  },
  {
    id: "q-combine",
    stageId: "interference",
    title: "Interference is the engine",
    narration:
      "So how do you make the right answer win that one look? Interference, the single idea the whole field rests on. Amplitude travels along many paths at once, and each path carries a phase, the way a wave carries crests and troughs. Set the program up well and, at the wrong answers, the waves meet out of step and cancel to nothing; at the right answer, they meet in step and pile up. Nothing is tried in parallel. The answer is steered. You will watch this happen for real later, down at the measurement chain.",
    program: "interference",
  },
  {
    id: "q-cold",
    stageId: "cold",
    title: "Colder than deep space",
    narration:
      "Room temperature at the top. Fifty kelvin, then four, at the pulse tube stages. Then the helium dilution unit takes over: under one kelvin at the still, a tenth at the cold plate, and ten to twenty thousandths of a degree at the mixing chamber. Space itself, at 2.7 kelvin, is over a hundred times warmer than the bottom of this machine.",
    program: "cold",
  },
  {
    id: "q-wiring",
    stageId: "wiring",
    title: "Signals down, whispers up",
    narration:
      "Follow the pulse down the drive line: at every floor an attenuator bleeds away room-temperature noise, sixty decibels of deliberate loss, until a clean whisper reaches the chip. Now follow the readout echo up: a parametric amplifier at the coldest floor, a transistor amplifier at four kelvin, each boosting the faintest signal electronics can handle.",
    program: "wiring",
  },
  {
    id: "q-chip",
    stageId: "chip",
    title: "The chip itself",
    narration:
      "Inside the shields at last. Aluminum on sapphire, and each cross-shaped pad is one qubit: a capacitor shunting a Josephson junction, two superconductors separated by an ultrathin oxide wall. The junction bends the circuit's energy levels apart so the bottom two become a clean 0 and 1. That asymmetry is the entire trick of the transmon.",
    program: "chip",
  },
  {
    id: "q-platforms",
    stageId: "platforms",
    title: "Rival machines",
    narration:
      "The chandelier is one answer, not the answer. Here are two rivals: charged atoms held in electric fields, driven by lasers, slower but astonishingly precise; and neutral atoms in a grid of laser tweezers, thousands of them, rearrangeable mid-computation. The race between platforms is genuinely undecided.",
    program: "platforms",
  },
  {
    id: "q-compile",
    stageId: "compile",
    title: "A circuit becomes pulses",
    narration:
      "Now run a program. It starts as a circuit of abstract gates. The compiler breaks every box into the chip's native moves, walks distant qubits together with SWAPs, and schedules the result as microwave pulses timed to the nanosecond. Watch the three boards: circuit, native gates, waveform.",
    program: "compile",
  },
  {
    id: "q-pulse",
    stageId: "pulse",
    title: "Twenty nanoseconds of microwave",
    narration:
      "A gate, physically. The shaped pulse travels down, strikes the qubit at its own resonant frequency, and the Bloch arrow sweeps exactly the commanded angle. Tens of nanoseconds per rotation, error around one part in a thousand. This is the machine's heartbeat: pulse, rotate, pulse, rotate.",
    program: "pulse",
  },
  {
    id: "q-interference",
    stageId: "interference",
    title: "Where the answer comes from",
    narration:
      "The secret of every quantum algorithm, in one picture. Amplitude flows along many paths; paths carry phase. At the wrong answers, the waves arrive out of step and cancel to nothing. At the right answer, they arrive in step and pile up. By the time anyone measures, the choreography has already decided. Interference is the computation.",
    program: "interference",
  },
  {
    id: "q-readout",
    stageId: "readout",
    title: "One echo, one bit",
    narration:
      "Measurement, without touching the qubit. A probe tone rings the readout resonator; the qubit's state has pulled that resonator slightly sharp or flat, so the echo returns phase-shifted. Amplified and plotted, each shot lands in one of two clouds. A line between the clouds turns quantum physics back into a classical bit, and the superposition is gone.",
    program: "readout",
  },
  {
    id: "q-decoherence",
    stageId: "decoherence",
    title: "The tide always comes in",
    narration:
      "Why not just run longer programs? Because the environment is always listening, and listening destroys quantum states. Watch the two clocks drain: T1, energy leaking away; T2, phase scrambling even sooner. A hundred microseconds of coherence against thirty-nanosecond gates buys a few thousand operations. Then the state is mush.",
    program: "decoherence",
  },
  {
    id: "q-qec",
    stageId: "qec",
    title: "Many fragile, one tough",
    narration:
      "The escape plan. Spread one logical qubit across a grid of physical ones and ask only parity questions, never the data itself. Red flashes are errors; amber neighbors reveal them; the decoder races the clock to keep up. In 2024, Google's Willow showed that growing the grid makes the logical qubit better, not worse. The theory finally works in the metal.",
    program: "qec",
  },
  {
    id: "q-reality",
    stageId: "reality",
    title: "The honest scoreboard",
    narration:
      "End at the truth. Proven quantum wins are rare and specific: simulating quantum systems, breaking certain cryptography once machines are a thousand times larger, a square-root boost for search. Optimization and AI speedups remain hopes, not theorems. This machine is a wind tunnel for nature's own quantum physics, not a faster laptop. That is enough to matter.",
    program: "reality",
  },
];

export const QC_COUNTS = {
  stages: QC_STAGES.length,
  acts: Object.keys(QC_ACTS).length,
  journeySteps: QC_JOURNEY.length,
  platesInFridge: 6,
};

export const qcStageById = (id: string) => QC_STAGES.find((s) => s.id === id);
export const qcJourneyStepById = (id: string) => QC_JOURNEY.find((j) => j.id === id);
