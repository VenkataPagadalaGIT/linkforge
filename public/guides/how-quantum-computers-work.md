# How Quantum Computers Work: Fly Down the Golden Chandelier

A bit becomes a sphere, sixteen amplitudes collapse to one answer, and a microwave pulse rides six frozen floors down to a chip colder than deep space. Then the honest part: how errors are tamed, and what these machines are really for. Every claim from primary sources, adversarially re-verified.

> The machine as an explorable 3D film set: 16 stations across 4 acts, a 18-step guided journey from one qubit to the honest scoreboard, the dilution refrigerator drawn plate by plate at its real temperatures, the signal chain attenuating down and amplifying up exactly as the engineering references describe, and an interference station that shows where quantum answers actually come from. No parallel-universe myths survive contact with this page.

By Venkata Pagadala, AI Product Manager (Search · SEO · GEO), AT&T · Updated 2026-08-29 · 22 min read

Canonical: https://venkatapagadala.com/guides/how-quantum-computers-work
Tags: Quantum Computing, Qubits, Superposition, Quantum Error Correction, Dilution Refrigerator, 3D Interactive, Physics Explainer

## What is a quantum computer?

A quantum computer is a machine that uses the rules of **quantum physics**, the physics of atoms and the tiny particles inside them, to solve a handful of specific problems that are effectively out of reach for an ordinary computer, no matter how powerful that computer gets. It is not a faster laptop, and it will not run your email or your games any quicker. It is a specialist, built for a short list of very hard problems where ordinary computers simply run out of road.

## How is it different from a normal computer?

An ordinary computer stores everything as **bits**. A bit is a tiny switch that is either off or on, a 0 or a 1, and every photo, song, and spreadsheet is just a huge pile of those switches. A quantum computer uses quantum bits, or **qubits**. Think of a qubit like a coin that is still spinning in the air: while it spins it is not heads and not tails, it holds some chance of both at once. A qubit works the same way: it can sit in a blend of 0 and 1 until you check it. Here is the catch, and it matters: the moment you look, the coin lands. Each qubit gives you one plain answer, a 0 or a 1, and the in-between vanishes. So a quantum computer does not read out every possibility at once. The real skill is arranging the problem so that, when the coins finally land, the answer you want is the one most likely to show up.

## What is it actually good for?

Quantum computers are specialists, not all-rounders, and they are a good fit for only a few kinds of problem. The first is **simulating nature** itself, how molecules and materials actually behave, which could speed up the search for new medicines, better batteries, and new materials. The second is certain **giant search and optimization** problems, like finding the best option among an enormous number of choices, from delivery routes to financial portfolios. The third is a double-edged one: a large enough quantum computer could **break some of the encryption** that protects data online today, which is why governments and banks are already preparing for it. For almost everything else, from web browsing to video to everyday number-crunching, an ordinary computer is still faster, cheaper, and the right tool.

## Is it real yet, or is this hype?

Yes. Quantum computers are real, and you can rent time on one over the internet right now. But they are early: today's machines are small and error-prone, meaning they make many mistakes and lose their delicate quantum state easily. No quantum computer has yet done a genuinely useful job faster or cheaper than a good ordinary computer. That milestone even has a name, **quantum advantage**, and it has not been crossed for a real-world task. So this is not hype, but it is not around the corner either, and it will not replace the computer on your desk. The likely future is the two working side by side, with the quantum machine called in only for the rare problems it is built for. The hard part is keeping those qubits still and stable long enough to finish a calculation, which is why most of the machine you are about to explore is a refrigerator.

## Walk through the machine

Now the machine itself. Below is a superconducting quantum computer you can fly through, drawn honestly: the refrigerator plates at their real temperatures, control pulses that visibly weaken on the way down, a readout echo amplified on the way back up, and the interference step where the answer actually appears. **Play the journey** for the guided tour, or click any station to jump straight to it.

*(Interactive 3D content: explore it at https://venkatapagadala.com/guides/how-quantum-computers-work)*

> **What you're looking at:** **Blue**, front right: the physics, a bit becoming a Bloch sphere, sixteen amplitude bars collapsing to one winner, an entangled pair whose meters always agree. **Gold**, center left: the dilution refrigerator, six plates from 300 kelvin to fifteen thousandths of a degree, with the chip in shields at the bottom, plus the rival ion-trap and atom-array platforms. **Violet**, middle row: a program running, compiler to microwave pulse to interference to the readout clouds. **Green**, back: the hard part, coherence draining, the error-correction grid, and the honest scoreboard.

> **What is computed and what is staged:** **Real:** every temperature, time, count and error rate a label shows comes from src/data/quantum.ts, which traces to a knowledge base built from primary sources and then adversarially re-verified; the fridge geometry follows the real plate stack; the attenuation and amplification the wiring animation shows are the real signal chain. **Staged:** the animations are choreography, not simulation. The amplitude bars, the interference waves and the error-correction cycle illustrate the mechanisms; no Schrodinger equation is being integrated in your browser. An explainer that blurs this line does not deserve your trust, so here it is in writing.

## The journey, in plain text

The same 18 steps the interactive journey walks through, as text, for reading (and for the crawlers and answer engines that can't run WebGL).

1. **Meet the whole machine.** Before we go inside, here is the whole thing. This golden chandelier is really a refrigerator hanging upside down: six floors, each colder than the last, and at the very bottom, inside those shields, a chip the size of your thumbnail. Almost all of this metal exists for one job, keeping that chip cold and still. We will start with the smallest thing on it, a single qubit, and build up from there.
2. **A switch becomes a sphere.** Start with what you know: a bit, a switch, off or on. Now watch the switch melt into a globe. A qubit can point anywhere on this sphere, and the two poles are the old 0 and 1. Everything strange about quantum computing begins with the space between the poles.
3. **What superposition really buys.** Four qubits, sixteen amplitude bars. The register now holds a weight for every possible four-bit string at the same time, and n qubits hold 2 to the n of these weights. That sounds like enormous parallel storage, and in a sense it is. But hold one thought before the next beat: these weights are not answers you can read out. They are raw material.
4. **You only get one bit out.** Here is the catch that kills the myth. The instant you measure the register, the whole blend collapses: one bar wins, every other vanishes, and all you get back is a single ordinary string of 0s and 1s. You never see the weights themselves. So a quantum computer is not a machine that checks every answer at once and hands you the right one. You get one look, and one plain answer. The entire art is arranging those weights beforehand so the answer you want is the one most likely to survive the look.
5. **Gates are rotations.** One qubit, up close. The arrow is its state. Watch a Hadamard carry the north pole to the equator, an X gate flip it through, a Z gate spin the phase. Every single-qubit gate ever invented is a rotation of this globe by an exact angle. Remember that; in a moment you will see what performs the rotation physically.
6. **Two qubits, one fate.** Two qubits pass through an entangling gate and stop being individuals. Their spheres dim, because neither has a state of its own anymore; only the pair does. Measure one and both meters snap together, every time, at any distance. No message travels. The correlation was manufactured here, in the gate.
7. **Interference is the engine.** So how do you make the right answer win that one look? Interference, the single idea the whole field rests on. Amplitude travels along many paths at once, and each path carries a phase, the way a wave carries crests and troughs. Set the program up well and, at the wrong answers, the waves meet out of step and cancel to nothing; at the right answer, they meet in step and pile up. Nothing is tried in parallel. The answer is steered. You will watch this happen for real later, down at the measurement chain.
8. **Colder than deep space.** Room temperature at the top. Fifty kelvin, then four, at the pulse tube stages. Then the helium dilution unit takes over: under one kelvin at the still, a tenth at the cold plate, and ten to twenty thousandths of a degree at the mixing chamber. Space itself, at 2.7 kelvin, is over a hundred times warmer than the bottom of this machine.
9. **Signals down, whispers up.** Follow the pulse down the drive line: at every floor an attenuator bleeds away room-temperature noise, sixty decibels of deliberate loss, until a clean whisper reaches the chip. Now follow the readout echo up: a parametric amplifier at the coldest floor, a transistor amplifier at four kelvin, each boosting the faintest signal electronics can handle.
10. **The chip itself.** Inside the shields at last. Aluminum on sapphire, and each cross-shaped pad is one qubit: a capacitor shunting a Josephson junction, two superconductors separated by an ultrathin oxide wall. The junction bends the circuit's energy levels apart so the bottom two become a clean 0 and 1. That asymmetry is the entire trick of the transmon.
11. **Rival machines.** The chandelier is one answer, not the answer. Here are two rivals: charged atoms held in electric fields, driven by lasers, slower but astonishingly precise; and neutral atoms in a grid of laser tweezers, thousands of them, rearrangeable mid-computation. The race between platforms is genuinely undecided.
12. **A circuit becomes pulses.** Now run a program. It starts as a circuit of abstract gates. The compiler breaks every box into the chip's native moves, walks distant qubits together with SWAPs, and schedules the result as microwave pulses timed to the nanosecond. Watch the three boards: circuit, native gates, waveform.
13. **Twenty nanoseconds of microwave.** A gate, physically. The shaped pulse travels down, strikes the qubit at its own resonant frequency, and the Bloch arrow sweeps exactly the commanded angle. Tens of nanoseconds per rotation, with an error rate from about one part in a thousand on the best hardware to one in a hundred on the rest. This is the machine's heartbeat: pulse, rotate, pulse, rotate.
14. **Where the answer comes from.** The secret of every quantum algorithm, in one picture. Amplitude flows along many paths; paths carry phase. At the wrong answers, the waves arrive out of step and cancel to nothing. At the right answer, they arrive in step and pile up. By the time anyone measures, the choreography has already decided. Interference is the computation.
15. **One echo, one bit.** Measurement, without touching the qubit. A probe tone rings the readout resonator; the qubit's state has pulled that resonator slightly sharp or flat, so the echo returns phase-shifted. Amplified and plotted, each shot lands in one of two clouds. A line between the clouds turns quantum physics back into a classical bit, and the superposition is gone.
16. **The tide always comes in.** Why not just run longer programs? Because the environment is always listening, and listening destroys quantum states. Watch the two clocks drain: T1, energy leaking away; T2, phase scrambling even sooner. A hundred microseconds of coherence against thirty-nanosecond gates buys a few thousand operations. Then the state is mush.
17. **Many fragile, one tough.** The escape plan. Spread one logical qubit across a grid of physical ones and ask only parity questions, never the data itself. Red flashes are errors; amber neighbors reveal them; the decoder races the clock to keep up. In 2024, Google's Willow showed that growing the grid makes the logical qubit better, not worse. The theory finally works in the metal.
18. **The honest scoreboard.** End at the truth. Proven quantum wins are rare and specific: simulating quantum systems, breaking certain cryptography once machines are a thousand times larger, a square-root boost for search. Optimization and AI speedups remain hopes, not theorems. This machine is a wind tunnel for nature's own quantum physics, not a faster laptop. That is enough to matter.

## Every station, with sources

| Station | Act | What happens | Real numbers | Primary source |
|---|---|---|---|---|
| Bit vs Qubit | A different kind of bit | A switch, and then a direction. Everything classical computing has ever done runs on switches that are either off or on, 0 or 1. A qubit is built from something physical too, the two lowest energy levels of a tiny circuit, a single trapped ion, one atom. But between preparation and measurement it is not forced to be either level. Its state is a weighted blend of both, and the weights are the program's raw material. | Classical bit states: 2, occupied one at a time · Qubit description: 2 complex amplitudes · Amplitude rule: |a|² + |b|² = 1 | Nielsen & Chuang, Quantum Computation and Quantum Information (2000) |
| Superposition, Honestly | A different kind of bit | Amplitudes are not parallel computers. Here is the most misquoted fact in the field. A register of n qubits is described by 2^n amplitudes, and for 300 qubits that is more numbers than there are atoms in the observable universe. The pop-science leap is 'so it computes all answers at once'. It does not. When you measure, you get one outcome, sampled by the amplitudes. All the cleverness of quantum algorithms is in making the wrong outcomes cancel before that single sample is taken. | Amplitudes at n = 300: 2³⁰⁰ ≈ 10⁹⁰ · Answers per measurement: exactly 1 · Why algorithms work: interference, not parallelism | Aaronson, Quantum Computing Since Democritus; Preskill lecture notes |
| The Bloch Sphere | A different kind of bit | Every single-qubit state is a point on a globe. One qubit's every possible state maps to a point on a sphere. North pole is |0>, south pole is |1>, and the whole equator is equal 0-and-1 blends that differ only in phase. Quantum gates stop being mysterious here: every one-qubit gate is just a rotation of this globe, and a microwave pulse of the right frequency and duration performs exactly that rotation. | Poles: |0> north, |1> south · Equator: equal superpositions, phase varies · Any 1-qubit gate: a rotation of the sphere | Bloch (1946); standard treatment in Nielsen & Chuang ch. 1 |
| Entanglement | A different kind of bit | Two qubits, one inseparable description. Put two qubits through the right two-qubit gate and they stop having individual states at all. The pair (|00> + |11>)/sqrt(2) is a fifty-fifty bet on 00 or 11, and nothing else: measure one qubit and the other's outcome is fixed, instantly, at any distance. Einstein hated this. Experiments keep confirming it. It sends no signal, because neither side can choose the outcome, but it is the resource that makes a register more than the sum of its qubits. | Bell state: (|00> + |11>)/√2 · Faster-than-light signalling: none, provably · Bell test Nobel: 2022 (Aspect, Clauser, Zeilinger) | Bell (1964); Aspect et al. (1982) |
| The Golden Chandelier | The machine | It is a refrigerator, and the computer hangs at the bottom. The famous golden chandelier is what a dilution refrigerator looks like with its vacuum cans removed. Each gold-plated copper plate is a temperature floor, colder than the one above, and the actual quantum chip hangs in shielding beneath the lowest plate at about ten to twenty thousandths of a degree above absolute zero. Everything else, the tubes, the coils, the hundreds of cables, exists to get signals down to that chip and back out without carrying heat or noise along. | Mixing chamber: ~10-20 mK · Deep space (CMB): 2.7 K, ~150x warmer · Cooldown to base: under 24 h (empty fridge, vendor spec) | Krantz et al. (2019), A Quantum Engineer's Guide, arXiv:1904.06560 |
| Why So Cold | The machine | Heat is randomness, and randomness is the enemy. A superconducting qubit's two levels are separated by an energy so small that ordinary warmth would scramble it constantly. At room temperature the environment would kick the qubit between its states billions of times a second. Cool the chip until thermal energy is far below the level spacing and the qubit finally sits still in its ground state, waiting to be told what to do. Cold is also what makes the circuits superconduct, so current flows with zero resistance and no dissipative noise of its own. | Qubit frequency: ~4-8 GHz · 50 K / 4 K / still / CP / MXC: the five cold floors · Thermal photons at 15 mK: effectively zero at 5 GHz | Krantz et al. (2019), section on cryogenic setup |
| Signals Down, Whispers Up | The machine | Attenuate everything going down, amplify everything coming up. Control pulses are born in room-temperature electronics, which means they arrive carrying room-temperature noise. So the drive lines deliberately throw most of the signal away: attenuators bolted to each plate bleed off the noise as heat where the fridge can absorb it. The readout signal has the opposite problem. It leaves the chip almost unmeasurably faint and must be amplified in stages: first by a quantum-limited parametric amplifier at the coldest plate, then by a transistor amplifier at 4 K, before room-temperature electronics digitize it. | Drive-line attenuation: ~60 dB total, distributed · 50-qubit processor wiring: 124 RF lines (Krinner et al.) · TWPA gain at ~10 mK: 20-30 dB, near quantum limit · HEMT gain at 4 K: ~+40 dB | Macklin et al. (2015), Science; Krantz et al. (2019) |
| The Chip Itself | The machine | A capacitor, a weird inductor, and nothing else. Under the shields sits a chip that would not look out of place in a classical fab: aluminum patterns on silicon or sapphire. Each qubit is an LC oscillator with one exotic ingredient, a Josephson junction, two aluminum superconductors separated by an ultrathin aluminum-oxide barrier. Electrons tunnel through it as pairs, and that tunneling makes the oscillator nonlinear: its energy levels are unevenly spaced, so the bottom two can be addressed as |0> and |1> without accidentally exciting the third. | Junction: Al/AlOx/Al, ultrathin oxide barrier · Anharmonicity: ~ -200 to -300 MHz · Modern T1: order 100 µs (device median) | Koch et al. (2007), the transmon paper, arXiv:cond-mat/0703002 |
| Other Ways to Build a Qubit | The machine | The chandelier is one answer, not the answer. Trapped-ion machines hold charged atoms in radio-frequency electric fields inside an ultra-high vacuum, and drive gates with lasers; their qubits are nearly identical by nature and their fidelities are the best in the field, but gates run roughly a thousand times slower than superconducting ones. Neutral-atom machines hold arrays of atoms in optical tweezers and entangle them through Rydberg states, scaling to thousands of atoms. Photonic machines encode qubits in light itself. Nobody knows which platform wins; the honest answer is that the race is live. | Ion 2-qubit fidelity: >99.9% (best published) · Ion vacuum: below ~10⁻¹¹ mbar · Neutral-atom arrays: 1,000+ traps demonstrated | Cirac & Zoller (1995); Molmer & Sorensen (1999) |
| From Circuit to Pulses | A program runs | Your algorithm becomes rotations a chip can actually do. You write a quantum program as a circuit: qubits as horizontal wires, gates as boxes. The hardware cannot run most of those boxes directly. A compiler decomposes every gate into the machine's small native set, then confronts the floor plan problem: on a real chip each qubit talks only to its neighbors, so when the circuit wants two distant qubits to interact, the compiler inserts SWAP gates to walk their states together. Then everything becomes a pulse schedule, timed to the nanosecond. | Universal set: 1-qubit rotations + CNOT · One SWAP costs: 3 CNOTs · Pulse timing: nanosecond resolution | Nielsen & Chuang ch. 4; Qiskit transpiler documentation |
| A Gate Is a Pulse | A program runs | Twenty nanoseconds of shaped microwave = one rotation. Down in the fridge, a gate is not a box, it is an event. A microwave burst at the qubit's own frequency, shaped like a smooth bell and lasting tens of nanoseconds, drives the qubit's state around the Bloch sphere by exactly the angle the compiler asked for. Hold the pulse twice as long, rotate twice as far. Two-qubit gates are choreographed the same way, using a coupler or a cross-resonance drive so one qubit's rotation becomes conditional on its neighbor. | 1-qubit gate: ~10-40 ns · 2-qubit gate: ~30-200 ns · Best 2-qubit error: ~0.1-0.3% | Motzoi et al. (2009), DRAG; Krantz et al. (2019) |
| Interference Does the Work | A program runs | Wrong answers cancel, right answers reinforce. This station is the entire secret. A quantum algorithm routes amplitude along many computational paths at once, and paths carry phase. Where two paths reach the same wrong outcome with opposite phase, they annihilate. Where paths agree, they add. Shor's algorithm and Grover's search are, at bottom, interference patterns engineered so that by measurement time, nearly all the amplitude is piled on the answer. No cleverness at readout can rescue a circuit that failed to arrange this; the choreography is the computation. | Grover speedup: √N queries, provably optimal · Shor vs best classical: polynomial vs superpolynomial · Rescue at readout: impossible; interference or nothing | Grover (1996); Shor (1994) |
| Measurement | A program runs | One microwave echo, one bit. To read a superconducting qubit you never touch it directly. Each qubit sits next to its own small resonator, and the qubit's state pulls that resonator's pitch slightly sharp or flat. Send a probe tone through, and the echo comes back with a phase shift that depends on whether the qubit was |0> or |1>. After amplification, the electronics plot each echo as a point on a plane; the points fall into two clouds, and a line between the clouds turns physics into a classical bit. | Readout time: tens to a few hundred ns · Assignment fidelity: ~99% (98.25% in 48 ns shown) · What collapses: the measured qubit's superposition | Blais et al. (2004), circuit QED; Krantz et al. (2019) |
| Decoherence | The hard part | The environment measures you whether you like it or not. Every quantum state is perishable. Stray photons, vibrations, cosmic rays, even the wiring itself: anything that learns about the qubit's state destroys its superposition, exactly as a deliberate measurement would. Two clocks tick against every program. T1 is how long before an excited qubit relaxes and its energy leaks away. T2 is how long before the delicate phase relationship, the thing interference depends on, is scrambled. Every gate spent is coherence budget spent. | T1, T2 today: order 100 µs (transmons) · Hard bound: T2 ≤ 2·T1 · Ops per coherence window: a few thousand | Krantz et al. (2019); device papers per platform |
| Error Correction | The hard part | Many fragile qubits, one tougher one. You cannot photocopy a quantum state, so you cannot back it up. The escape is to spread one logical qubit across many physical qubits and repeatedly ask delicate stabilizer questions that reveal where an error happened without revealing the data itself. A classical decoder races to interpret that stream and track corrections. In late 2024 Google's Willow chip crossed the line the field had chased for thirty years: making the code bigger made the logical qubit better, not worse. Error correction stopped being theory that year. | Willow error suppression: ~2.1x per distance step · Syndrome cycle: ~1 µs (superconducting) · Overhead: hundreds-to-thousands physical per logical | Google Quantum AI, Nature (2024), the Willow below-threshold paper |
| What They're Actually For | The hard part | Provable speedups are rare, and that is fine. The honest scoreboard: quantum computers will not speed up most computation. The proven wins are specific. Simulating quantum systems themselves, which is chemistry and materials, was the original point and remains the best bet. Factoring, which breaks RSA, is proven but needs fault-tolerant machines with millions of physical qubits, which is why cryptography is migrating now. Unstructured search gets a quadratic boost only. Optimization and machine learning speedups remain unproven hopes. Anyone selling more than this is selling. | RSA-2048 estimate: ~20M noisy qubits (2019 est.) · Flagship QEC chip, 2024: 105 qubits (Willow) · Proven exponential wins: few: simulation, factoring-class | Preskill (2018), NISQ, arXiv:1801.00862; Gidney & Ekera (2019) |

## How software becomes a pulse, and back

A quantum computer is not just the chip in the cold. It is a stack of layers that turns your program into microwave pulses, sends them down to the qubits, and turns the faint signal that returns into an answer. Together they work as a **quantum-classical co-processor**: the quantum chip does the one thing it is good at, and ordinary classical computers do everything else around it. The US National Academies' 2019 reference model names four layers, top to bottom:

1. **Host processor.** An everyday classical computer running the software toolchain, Qiskit or Cirq and the like. It compiles your circuit, handles storage and networking, and hands the job down over a high-speed link.
2. **Control processor plane.** The real-time brain, usually FPGA boards. It sequences the exact gates and measurements the algorithm calls for, and in an error-corrected machine it runs the decoding loop that keeps the qubits alive.
3. **Control and measurement plane.** Room-temperature electronics that turn digital instructions into the analog microwave or laser pulses that drive the qubits, and that digitize the returning signal back into classical bits.
4. **Quantum data plane.** The heart of the machine: the qubits themselves, plus the wiring, shielding, and refrigeration that let them hold a state at all. This is the part inside the cold.

A program makes one round trip through these layers every time it runs. It flows **down**, from host to control processor to signal electronics and into the cold, and the answer flows **back up**, the qubits' faint echo amplified stage by stage, digitized, and turned into the 0s and 1s you came here for. One honest caveat on scale: today's approach of running a handful of wires per qubit down from room temperature is expected to hold only to around a thousand physical qubits before something new is needed.

### The full signal chain, stage by stage

Getting a clean pulse to a qubit, and a faint one back out, is an engineering feat in itself. Every number here traces to the superconducting-hardware literature.

- **Going down (drive lines).** About 60 decibels of attenuation is added on the way to the chip, and, against intuition, the largest attenuators sit at the coldest stages, canonically around 20 dB each at the 4 K, cold-plate, and mixing-chamber stages. That deliberate loss strips away the room-temperature noise riding on the line so only a clean pulse reaches the qubit.
- **Coming back up (readout).** The outgoing signal is a whisper. A near-quantum-limited parametric amplifier at the mixing chamber, a TWPA or a JPA, boosts it by roughly 20 dB first, then a HEMT transistor amplifier at the 4 K stage adds about 40 dB more. Circulators and isolators let the signal out while blocking noise from coming back in, more than 60 dB of protection pointed at the fragile chip.
- **Where the pulses come from.** Modern control uses FPGA boards whose digital-to-analog converters run at several billion samples per second, shaping each pulse (a Gaussian with a DRAG correction that prevents leakage) at the qubit's transition frequency of roughly 3 to 6 GHz. A single-qubit gate takes about 10 to 20 nanoseconds.

## The real-time race: catching errors before they spread

Qubits are fragile, so a useful quantum computer has to fix its own errors while it runs, faster than new ones appear. This is the hardest problem in the field, and it is a genuine race between physics and classical computing. The trick is never to look at the working qubits directly, because looking would destroy the very state you are protecting. Instead:

1. **Spread one logical qubit across many physical ones.** A grid of *data* qubits holds the information, with extra *ancilla* qubits woven between them.
2. **Measure parity, not data.** The ancillas are repeatedly entangled with their neighbors and measured, giving a running stream of **syndrome** bits: X-type checks flag phase-flip errors, Z-type checks flag bit-flip errors, and the data itself is never read.
3. **Decode, fast.** A classical **decoder** reads the syndrome stream and infers the most likely pattern of errors. For the surface code this is a graph-matching problem solved with minimum-weight perfect matching; newer qLDPC codes use belief propagation with ordered-statistics post-processing (BP+OSD) and its faster parallel relative, localized statistics decoding (LSD), introduced in 2024.
4. **Keep up, or lose.** On Google's 2024 Willow processor a single syndrome round takes about 1.1 microseconds, and the decoder must keep pace with that stream round after round or the backlog grows without bound. Resolving an actual correction took the real-time decoder about 63 microseconds at code distance 5, running against qubits whose coherence lasted around 90 microseconds. The margins really are that tight.

One clever move buys breathing room: most corrections are never physically applied. The control software just tracks them in a **Pauli frame**, a running note that says this qubit is secretly flipped, and folds each correction into how it reads later results. The decoder's speed only becomes a hard wall right before a non-Clifford gate, such as a T gate, where the frame has to be resolved on the spot. That single moment is what the whole real-time race is really about.

> **Why 2024 was the turning point:** For twenty years the theory promised that if physical qubits were good enough, making the error-correcting grid **bigger** would make the logical qubit **better**, not worse. In 2024, Google's Willow processor showed exactly that, crossing what the field calls the error-correction threshold for the first time. It does not mean quantum computers are useful yet. It means the escape route is real, which is what the honest scoreboard at the end of the journey is measured against.

## The vocabulary that unlocks the papers

### Qubit (aka quantum bit)

The quantum unit of information: a two-level system whose state is a weighted blend of 0 and 1 until measured.

A qubit state is |psi> = a|0> + b|1> with complex amplitudes satisfying |a|^2 + |b|^2 = 1. Unlike a probability, an amplitude carries a phase, and phases are what interfere. Physically a qubit is the two lowest levels of a superconducting circuit, one trapped ion's internal states, one atom, or one photon's polarization. The information is analog and fragile in a way no classical bit is, which is why the rest of the machine exists.

- **Analogy:** A coin still spinning on the table, whose spin axis you can steer with perfect precision until the moment someone slaps it flat.
- **Example:** IBM, Google and Rigetti build transmon qubits; IonQ and Quantinuum trap ytterbium ions; QuEra holds rubidium atoms in laser tweezers.
- **Why it matters:** Every quantum roadmap number you read, 105 qubits, 1,000 qubits, counts these. The count that will matter more is logical qubits.

### Superposition

A definite quantum state that assigns amplitude to several classical outcomes at once; not indecision, and not parallel computation.

Superposition is the linearity of quantum mechanics: valid states can be added. A register of n qubits carries 2^n amplitudes, which grows beyond any classical memory around n = 50. The catch that pop science omits: measurement samples exactly one outcome. Amplitudes are leverage for interference, not free parallelism, and algorithms that beat classical computers do it by choreography, not by brute enumeration.

- **Analogy:** One wave on a pond holding the imprint of every stone thrown in, readable only by how the ripples reinforce and cancel.
- **Example:** Four qubits after four Hadamard gates hold equal amplitude on all 16 four-bit strings; measuring yields one string, uniformly at random.
- **Why it matters:** The single most common error in quantum coverage is 'tries all answers simultaneously'. A source that says this is not a reliable source.

### Entanglement

Correlation between qubits so strong that the pair has one state which cannot be split into individual states.

An entangled pair like (|00> + |11>)/sqrt(2) yields perfectly correlated measurement outcomes, at any separation, with no signal passing between them; Bell-inequality experiments have closed the loopholes and earned the 2022 physics Nobel. In a processor, entanglement is manufactured by two-qubit gates and consumed as the resource that lets n qubits explore a state space no n separate qubits could.

- **Analogy:** Two halves of a torn ticket sealed in envelopes: open one anywhere and you know the other, except quantum correlations are provably stronger than any torn-ticket story can explain.
- **Example:** A Hadamard on qubit A followed by CNOT from A to B turns |00> into the Bell state used to calibrate every two-qubit gate.
- **Why it matters:** Entangling-gate error is the metric that decides everything downstream, because two-qubit gates are ten times worse than one-qubit gates on every platform.

### Quantum Gate

A reversible operation on one or two qubits; physically, a shaped microwave or laser pulse lasting nanoseconds to microseconds.

Mathematically a gate is a unitary matrix; a one-qubit gate is a rotation of the Bloch sphere. Physically, a resonant pulse's duration and amplitude set the rotation angle, with envelope shaping (DRAG) suppressing leakage. Any computation can be built from one-qubit rotations plus one entangling gate such as CNOT or CZ, which is what 'universal gate set' means. Superconducting gates run in 10 to 200 ns; trapped-ion gates in tens of microseconds but with higher fidelity.

- **Analogy:** Pushing a swing at exactly its own rhythm: the length of the push, not its violence, decides the final angle.
- **Example:** A Hadamard takes |0> to the equator of the Bloch sphere; two of them in a row take it back, which is interference in miniature.
- **Why it matters:** Gate error times circuit depth is the honest capacity of any chip; that product, not qubit count, predicts what a device can run.

### Measurement

The act that turns amplitudes into one classical outcome, destroying the superposition it sampled.

The Born rule gives outcome probabilities as squared amplitudes; after the result, the state is the outcome (collapse). Superconducting processors measure dispersively: each qubit shifts its readout resonator's frequency by a state-dependent amount, so a probe tone returns phase-shifted, is amplified by a TWPA (20-30 dB) then a HEMT (~40 dB), and lands as a point in one of two clouds on the IQ plane. Around 99% assignment fidelity in under a hundred nanoseconds has been demonstrated.

- **Analogy:** Asking the spinning coin one blunt yes-or-no question. You get an answer, and the spin is gone.
- **Example:** Mid-circuit measurement of ancilla qubits, without disturbing data qubits, is the operation that makes error correction possible at all.
- **Why it matters:** Readout error is a first-class error budget line, and 'measurement collapses the state' is why quantum RAM-style intuitions fail.

### Transmon

The dominant superconducting qubit: a Josephson junction shunted by a capacitor, whose uneven energy ladder makes the bottom two levels addressable.

An ordinary LC circuit has evenly spaced levels, so a drive that excites 0 to 1 also excites 1 to 2. The Josephson junction's nonlinear inductance bends the ladder, typically by -200 to -300 MHz, so the bottom transition can be driven selectively at 4 to 8 GHz. The transmon design (Koch et al., 2007) trades charge sensitivity for that clean addressability, which is why Google, IBM and Rigetti all build variants of it.

- **Analogy:** A guitar with deliberately uneven frets, so the two notes you care about can be played without ever sounding the third.
- **Example:** Google's Willow chip is 105 transmons; its junctions are Al/AlOx/Al tunnel junctions with an ultrathin oxide barrier.
- **Why it matters:** When a headline says 'N-qubit chip' from IBM or Google, it means N transmons plus their resonators, couplers, and wiring.

### Dilution Refrigerator

The machine that holds superconducting qubits at ten to twenty millikelvin, using helium-3 dissolving into helium-4 as its final cooling stage.

A pulse-tube cryocooler reaches about 4 K; below that, circulating helium-3 crossing into a dilute helium-4 phase absorbs heat, stepping down through the still (~0.9 K) and cold plate (~0.1 K) to the mixing chamber (~0.01 K). The golden chandelier photos show the plate stack with its vacuum cans removed. Every plate also serves as a thermal anchor for the wiring, bleeding room-temperature noise out of the lines before it reaches the chip.

- **Analogy:** A six-story descent where each floor is quieter by a factor the one above cannot imagine, and the basement is over a hundred times colder than outer space.
- **Example:** Bluefors and Oxford Instruments fridges cool most of the world's superconducting processors; base temperature near 10 mK against the cosmic background's 2.7 K.
- **Why it matters:** The fridge, not the chip, sets much of the engineering agenda: wiring density, heat budget per line, and why million-qubit machines need new cryogenic architecture.

### Decoherence

The environment learning about a qubit and thereby destroying its quantum character; quantified by the times T1 and T2.

T1 is energy relaxation, the excited state decaying; T2 is dephasing, the phase relationship scrambling, bounded by T2 <= 2*T1. Any interaction that could in principle reveal the qubit's state acts as an unwanted measurement: stray photons, magnetic flux noise, quasiparticles, even cosmic-ray strikes that briefly poison a whole chip. Modern transmons sit near 100 microseconds; against 30-nanosecond gates that is a budget of a few thousand operations.

- **Analogy:** Writing in wet sand as the tide comes in: T1 washes letters away, T2 blurs them where they stand.
- **Example:** Doubling T1 has repeatedly required new materials and geometry, from 3D cavities to tantalum films; it does not come from cleverness in software.
- **Why it matters:** Coherence time divided by gate time is the depth budget, the number that explains why error correction is not optional.

### Logical Qubit & Surface Code

One error-protected qubit knitted from many physical ones, with stabilizer measurements catching errors without reading the data.

No-cloning forbids backups, so redundancy is entangled instead: a distance-d surface code patch uses on the order of 2d^2 physical qubits, and ancillas repeatedly measure parity checks whose violations locate errors. A classical decoder must keep pace with the roughly 1-microsecond syndrome cycle. Google's Willow result (2024) crossed the threshold in practice: each step from distance 3 to 5 to 7 cut logical error by about half, meaning bigger patches finally mean better qubits.

- **Analogy:** A choir holding one note where you may only ever ask pairs of singers whether they agree, never anyone for the note itself.
- **Example:** Estimates for breaking RSA-2048 run to roughly 20 million physical qubits, which is the distance between today's chips and cryptographic relevance.
- **Why it matters:** Logical qubit counts and logical error rates are the roadmap numbers that matter now; physical qubit counts alone stopped being informative in 2024.

### NISQ Era

Preskill's name for the current period: Noisy Intermediate-Scale Quantum devices, powerful enough to be interesting, too noisy for guarantees.

Coined in 2018, NISQ describes machines of tens to thousands of physical qubits without full error correction. They have demonstrated sampling tasks beyond classical simulation and increasingly credible error-mitigated physics experiments, but no commercially valuable problem is yet solved faster than classical computing. The field is now transitioning: below-threshold error correction in 2024 marks the start of the early fault-tolerant era, with useful logical machines projected toward the end of the decade.

- **Analogy:** Aviation in 1908: the machines demonstrably fly, crash often, carry no freight, and are obviously the future anyway.
- **Example:** Variational algorithms (VQE, QAOA) were designed for NISQ constraints; their practical advantage remains unproven after a decade of effort.
- **Why it matters:** NISQ is the calibration word: any claim of present-day quantum business value should be weighed against what NISQ honestly means.

## Four ways to build a qubit

No platform has won. Superconducting circuits are fastest and furthest on error correction; trapped ions are slowest and most precise; neutral atoms scale to the largest arrays; photonics bets on telecom-style manufacturing. The honest comparison:

| Platform | The qubit is | Gates via | Gate speed | Two-qubit fidelity | Strength | Limit |
|---|---|---|---|---|---|---|
| Superconducting | Transmon circuit on a chip | Microwave pulses, tunable couplers | Gates in 10-200 ns | ~99.7-99.9% two-qubit | Speed, fab scalability, below-threshold QEC shown | Millikelvin fridge, wiring per qubit, short coherence |
| Trapped ion | One charged atom in an RF trap | Laser pulses via shared motion | Gates in 10-100+ µs | >99.9% two-qubit (best published) | Fidelity, identical qubits, all-to-all in a chain | Slow gates, hard to scale past one chain |
| Neutral atom | One atom in an optical tweezer | Rydberg blockade between neighbors | Gates in ~1 µs or less | ~99.5% two-qubit (2023-24 results) | Thousands of traps, rearrangeable geometry | Atom loss, readout speed, younger toolchain |
| Photonic | A photon's mode or polarization | Interferometers, measurement-based fusion | Gates at light speed, probabilistic | Depends on scheme; loss-dominated | Room temperature (mostly), networking, chips from fabs | Photon loss, nondeterministic gates, detectors need cryo |

## Questions people actually ask

### Does a quantum computer try every answer at once?

No, and this is the most important correction in the field. A register of n qubits holds 2^n amplitudes, but measurement returns exactly one outcome, sampled by those amplitudes. Algorithms win by arranging interference so wrong outcomes cancel and right ones reinforce before anyone measures. Grover's search, for example, gives a square-root speedup, not the instant lookup the parallel-worlds picture would predict, and that gap is the proof the picture is wrong.

### Why does it have to be colder than outer space?

A superconducting qubit's two levels are separated by roughly a 5 GHz microwave photon's worth of energy, which is tiny. For thermal noise not to excite the qubit at random, the chip must be far colder than that energy scale, which lands at 10 to 20 millikelvin, about 150 times colder than the 2.7 kelvin cosmic microwave background. The cold also keeps the aluminum circuits superconducting, so they carry signals without resistance or its noise.

### Is the golden chandelier the computer?

The chandelier is the inside of the refrigerator: gold-plated copper plates at successively colder temperatures, laced with cabling and amplifiers. The computer itself is a chip about the size of a thumbnail, mounted in magnetic shielding below the coldest plate. Trapped-ion and neutral-atom machines look completely different: a steel vacuum chamber surrounded by laser optics, running near room temperature.

### Will quantum computers break my encryption?

Eventually, for some encryption. Shor's algorithm provably breaks RSA and elliptic-curve cryptography, but running it on RSA-2048 is estimated to need on the order of 20 million noisy physical qubits, against 105 qubits on 2024's flagship error-corrected chip. That is why the migration to post-quantum cryptography standards is happening now, calmly, years ahead: data stolen today could be decrypted later. Symmetric encryption like AES-256 is not meaningfully threatened.

### What are quantum computers actually good for?

The honest list is short. Simulating quantum systems, meaning chemistry, materials, and physics, is the original motivation and the strongest case. Factoring and related number theory breaks certain cryptography. Unstructured search gets a quadratic speedup only. Claimed advantages in optimization and machine learning remain unproven hypotheses. A quantum computer is a wind tunnel for nature's own quantum behavior, not a faster general-purpose computer.

### What is a logical qubit and why does everyone suddenly count them?

A logical qubit is one error-corrected qubit encoded across many physical qubits, with stabilizer measurements catching errors as they happen. It became the headline number after 2024, when Google's Willow demonstrated below-threshold error correction, meaning bigger codes now yield better qubits. Physical counts stopped being comparable across platforms years ago; logical qubit count times logical error rate is the honest scoreboard.

### Can I program a real quantum computer today?

Yes, free. IBM exposes real superconducting processors through Qiskit with a no-cost tier, and other platforms are reachable through cloud services. You write circuits in Python, they compile to pulses, run on genuine hardware in a dilution refrigerator, and return shot counts. Expect noisy results and small circuits; expect also that nothing teaches the reality of decoherence faster than watching your textbook circuit come back 12% wrong.

### Do entangled qubits communicate faster than light?

No. Measuring one half of an entangled pair fixes the other's outcome instantly, but neither party controls which outcome occurs, so no information travels. Proving that no-signalling holds is straightforward quantum mechanics, and it is why entanglement powers computation and cryptographic key distribution but cannot power a telegraph.

## Primary sources & further reading

## Sources & further reading

- [Nielsen & Chuang, Quantum Computation and Quantum Information](https://doi.org/10.1017/CBO9780511976667) · The standard textbook; chapters 1-2 cover everything in Act I.
- [Krantz et al. (2019), A Quantum Engineer's Guide to Superconducting Qubits](https://arxiv.org/abs/1904.06560) · The canonical hardware review behind Act II: control, readout, cryogenics.
- [Koch et al. (2007), the transmon paper](https://arxiv.org/abs/cond-mat/0703002) · Charge-insensitive qubit design; why the energy ladder is uneven.
- [Preskill (2018), Quantum Computing in the NISQ era and beyond](https://arxiv.org/abs/1801.00862) · The paper that named the current era and framed its honest limits.
- [Google Quantum AI (2024), quantum error correction below the surface code threshold](https://www.nature.com/articles/s41586-024-08449-y) · Willow: logical error halving with code distance, the field's 2024 milestone.
- [Shor (1994/97), Polynomial-time factoring on a quantum computer](https://arxiv.org/abs/quant-ph/9508027) · The algorithm that made cryptographers care.
- [Grover (1996), A fast quantum mechanical algorithm for database search](https://arxiv.org/abs/quant-ph/9605043) · Quadratic search speedup, provably optimal.
- [Feynman (1982), Simulating physics with computers](https://doi.org/10.1007/BF02650179) · The founding argument: nature is quantum, so simulate it quantumly.
- [Gidney & Ekera (2019), How to factor 2048-bit RSA integers in 8 hours using 20 million noisy qubits](https://arxiv.org/abs/1905.09749) · The standard resource estimate separating today from cryptographic relevance.
- [Macklin et al. (2015), A near-quantum-limited Josephson traveling-wave parametric amplifier](https://doi.org/10.1126/science.aaa8525) · The TWPA: how a readout whisper gets amplified without drowning it.
- [National Academies (2019), Quantum Computing: Progress and Prospects](https://doi.org/10.17226/25196) · Chapter 5 defines the four-layer reference model: quantum data plane, control and measurement plane, control processor plane, and host processor.
- [Krinner et al. (2019), Engineering cryogenic setups for 100-qubit scale superconducting circuits](https://arxiv.org/abs/1806.07862) · The signal chain behind the architecture section: the 20/20/20 dB attenuation split, HEMT and TWPA gains, isolation.
- [Fowler et al. (2012), Surface codes: towards practical large-scale quantum computation](https://arxiv.org/abs/1208.0928) · The surface code and minimum-weight perfect matching decoding; the foundation of the real-time error-correction loop.
- [Hillmann et al. (2024), Localized statistics decoding](https://arxiv.org/abs/2406.18655) · A fast, parallel decoder for qLDPC codes; the newest of the decoder families the error-correction section names.
- [Molmer & Sorensen (1999), Multiparticle entanglement of hot trapped ions](https://arxiv.org/abs/quant-ph/9810040) · The workhorse two-qubit gate of every trapped-ion machine.
- [IBM Quantum Learning](https://learning.quantum.ibm.com/) · Free courses and the path to running circuits on real hardware today.

## Related on this site

- [How LLMs Work: the 3D interactive guide](https://venkatapagadala.com/guides/how-llms-work)
- [How Neural Networks Work: fly through 13,002 parameters](https://venkatapagadala.com/guides/how-neural-networks-work)
- [The AI Concepts Encyclopedia: 187 concepts with definitions and sources](https://venkatapagadala.com/notebook/ai/encyclopedia)
