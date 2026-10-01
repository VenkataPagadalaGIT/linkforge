# The Interactive 3D HVAC Troubleshooter

> A complete residential split system — furnace, coil, ducts, refrigerant loop, condenser — modeled in 3D and wired to a fault ontology. Click parts to learn them; pick symptoms to diagnose them. 39 components, 22 symptoms, 35 faults across five system paths, real costs.

Updated 2026-07-04 · 22 min read

Canonical: https://venkatapagadala.com/guides/hvac-system-troubleshooting
Tags: HVAC, Air Conditioning, Furnace, Troubleshooting, 3D Interactive, Home Maintenance, Fault Diagnosis

Most HVAC guides are a wall of text about parts you've never seen. This one is different: below is a **full 3D model of a residential split system** — gas furnace, evaporator coil, ductwork, refrigerant lines, outdoor condenser — that you can orbit, explode, and click. Behind it sits a fault ontology: 39 components, 22 symptoms, and 35 faults connected by cause-and-effect edges, segmented into the five system paths every failure lives on. Tell it what you're seeing, and it ranks what's actually wrong, what to check first, and what a fix typically costs.

> **Before anything else:** Two checks resolve an outsized share of 'broken' systems: a **clogged air filter** (the #1 cause of HVAC problems) and an interrupted control circuit — **dead thermostat batteries, a tripped breaker, or a full condensate pan tripping its float switch**. Ten minutes, zero dollars, no tools.

## Explore the system in 3D

Drag to orbit, scroll to zoom. **Explore mode**: click any part to see what it does and how it fails. **Diagnose mode**: pick the symptoms you're seeing and suspect parts glow amber while ranked causes appear on the right. Toggle **Running** to watch the refrigerant loop and fans, and **Exploded** to pull the system apart.

*(Interactive 3D content: explore it at https://venkatapagadala.com/guides/hvac-system-troubleshooting)*

## How a central HVAC system actually works

Cooling is a loop that moves heat, not a machine that 'makes cold.' Indoors, the blower pulls room air through the filter and pushes it across the **evaporator coil**, where refrigerant boiling at ~40°F absorbs the air's heat and moisture. The **compressor** squeezes that vapor hot and dense and sends it to the outdoor **condenser coil**, where the fan dumps the heat into outside air. The refrigerant condenses back to liquid, returns indoors through the thin copper line, and the **TXV** meters it into the coil to start again. Around and around, moving heat from where you don't want it to where you don't care.

Heating (in the gas-furnace system modeled here) skips the refrigerant entirely: the igniter lights the **burners**, flames heat the sealed **heat exchanger**, and the same blower pushes air over its hot surface — combustion gases and breathing air never mixing. That one-sentence safety contract is why a cracked heat exchanger is the only fault on this page that's about life safety instead of comfort.

> **The one-line version:** The **thermostat** asks. The **blower** moves air. The **refrigerant loop** moves heat out (cooling); the **burners and heat exchanger** add heat in (heating). Everything else on this page — filter, capacitor, contactor, drains, ducts — exists to keep those four jobs running, and is where most failures actually live.

## The numbers: droop, balance point, and when emergency heat kicks in

Heat-pump owners live or die by three numbers nobody explains. **Droop**: a staging thermostat calls for the next stage when the room falls ~1.5–2°F below the set point — backup strips don't wait for 'cold,' they wait for that gap. **Balance point**: the outdoor temperature (typically 25–40°F, set per house) below which the heat pump alone can no longer keep up. **Aux lockout**: the setting that forbids strips above a chosen outdoor temperature — the single best defense against silent 3–5x bills.

- **Set 70°F, outdoor 45°F:** the heat pump cycles normally (10–20 min runs). AUX showing on the thermostat in this weather is the red flag — see the stuck-aux fault.
- **Set 70°F, outdoor 20°F:** below most balance points. The compressor runs almost continuously — that's normal, not a fault. If the house HOLDS 70°F, strips stay off and the bill survives. If the room sags to ~68°F (the 2°F droop), AUX stages in until it recovers, in bursts. Bursts are fine; constant AUX is money burning.
- **Set 60°F, outdoor 20°F:** a lower set point means less load — the heat pump usually carries this alone, and aux should engage only briefly during defrost cycles. If AUX runs constantly holding 60°F, something is lying (sensor, board, or staging).
- **Setback recovery (60°F → 70°F at 6am):** asking for a >2°F jump exceeds droop instantly, so a basic thermostat slams the strips on every morning — the classic self-inflicted aux bill. Use gradual 'smart recovery,' or keep setbacks small on heat pumps.
- **During defrost (every 30–90 min below ~40°F outdoor):** the system briefly runs in cooling to melt the outdoor coil and energizes strips so the vents don't blow cold. A few minutes of AUX + a steam plume outside = healthy, not broken.

> **Numbers worth memorizing:** Droop before staging: **1.5–2°F**. Balance point: **25–40°F** outdoor. Aux lockout: set it **≥35–40°F**. Supply air: heat pump alone **90–100°F**, strips engaged **105–125°F** (the hand-on-the-register test). Defrost: **30–90 min** cycles below 40°F. Healthy cool/heat cycle: **10–20 minutes** — under 5 is short cycling.

## The pressure test: what the gauges tell a tech

When a technician clips **manifold gauges onto the service valves' Schrader ports** (the two capped brass valves where the copper lines enter the outdoor unit — modeled above), the refrigerant loop finally talks. Typical healthy R-410A numbers while cooling on a ~90°F day: **suction ~115–140 psi** (a coil boiling around 40°F) and **liquid ~350–420 psi**, with **superheat ~8–15°F** and **subcooling ~8–12°F**. Those four numbers separate diagnoses that feel identical from the couch:

- **Low suction + low head + low subcool** → undercharged: there's a leak. Demand the leak search, not a top-off.
- **Low suction + normal head + high superheat** → the coil is starved, not empty: metering device (TXV) or a plugged filter-drier — this is the misdiagnosis triangle where 'needs freon' wastes money.
- **High head + high subcool** → overcharged or the condenser can't reject heat (matted coil, dead fan).
- **Both sides equalized while the compressor 'runs'** → the compressor isn't pumping: valves are gone.
- **Leak confirmation:** the loop holds **300–500 psi of dry nitrogen** for hours if it's tight — bubbles or an electronic sniffer find the exit. This is the test that ends the recharge-every-spring cycle.

> **The homeowner's share of the pressure test:** Exactly two things: check that **both brass caps on the service valves are present and snug** (a leaking Schrader core under a missing cap is a classic slow leak), and **write down the numbers the tech reads out** — suction, head, superheat, subcool go straight into your intake report. Hooking up gauges yourself is EPA 608 territory, and every connection loses a little charge.

## The ten parts that matter

Every diagnosis on this page traces back to one of these. Learn what each does and its signature failure, and you can translate any symptom — and any contractor quote — into physics.

### Thermostat (aka Control, Stat)

The thermostat is the system's decision-maker: it measures room temperature against your set point and switches heating, cooling, and the fan on and off.

Everything downstream — furnace, blower, outdoor unit — only runs when the thermostat closes a 24-volt circuit asking for it. That low-voltage chain also runs through safety devices like the condensate float switch and the furnace door switch, which is why a full pan or an ajar panel can make a healthy system play dead. Because it sits at the top of the chain, the thermostat is always the first suspect when nothing runs at all.

- **Analogy:** A referee with a whistle. The players (furnace, AC, blower) are fine — but nobody moves until the whistle blows, and a referee with a dead whistle looks exactly like a team that can't play.
- **Example:** A system 'dead' in July: the screen is blank because two AA batteries died. Batteries, five minutes, zero dollars — versus the $150 service call that discovers the same thing.
- **Common failure modes:** Dead batteries, mode left on HEAT in summer, schedule holds overriding the set point, loose low-voltage wires, or a tripped float switch upstream interrupting the same circuit.

### Air Filter

A disposable mesh that strains dust from return air before it reaches the blower and coil — and the single most common cause of HVAC problems when neglected.

Every cubic foot of air the system moves passes through this one rectangle. As it loads up, airflow drops; the evaporator coil runs colder and colder until it ices into a solid block in summer, and the furnace overheats and trips its limit switch in winter. A huge share of 'my AC died' service calls end at a $10 filter. Size and thickness are printed on the frame; 1-inch filters want changing every 1–3 months.

- **Analogy:** A coffee filter for your house's lungs. Ignore it long enough and you're trying to breathe through a wet paper towel.
- **Example:** Weak airflow + ice on the copper lines + a filter you can't see light through = case closed. Replace, thaw with fan-only for a few hours, done.
- **Common failure modes:** Clogging (weak airflow, iced coil, tripped furnace limit, rising bills). Also being installed backwards or missing entirely, which fouls the blower and coil instead.

### Blower Motor & Wheel (aka Air handler fan, Squirrel cage)

The motor-driven wheel inside the indoor unit that actually moves air — pulling it through the return and filter, pushing it across the coil or heat exchanger and out to the rooms.

Cooling and heating both depend on it: refrigerant can make the coil cold and burners can make the exchanger hot, but nothing reaches your rooms without the blower. Modern variable-speed (ECM) blowers are efficient but their control modules are the expensive way they fail. Years of running against a dirty filter is what wears blowers out early.

- **Analogy:** The system's lungs. The rest of the equipment decides the temperature; the blower decides whether any of it reaches you.
- **Example:** Thermostat calling, outdoor unit humming along, and total silence at every vent — that's a blower problem, and the iced-over coil that follows is the collateral damage.
- **Common failure modes:** Worn bearings (screech/grind at startup), overheated windings or a dead ECM module (hum, no spin, hot electrical smell), and slow death from chronic filter neglect.

### Evaporator Coil (aka A-coil, Indoor coil)

The A-shaped coil above the furnace where cold refrigerant absorbs heat and moisture from indoor air — the place cooling actually happens.

Refrigerant boils inside this coil at around 40°F, soaking up heat from the air the blower pushes across it. The moisture that condenses on its fins is why AC also dehumidifies — and why there's a drain pan under it. The coil lives at the intersection of the system's two flows, so it's where problems from either side show up: starve it of airflow or of refrigerant and it ices; let it get filthy and capacity quietly evaporates.

- **Analogy:** A glass of iced tea on a humid porch. Warm air touches the cold surface, gives up its heat, and leaves its moisture beading on the outside.
- **Example:** House won't get below 78 on a 95° day, lines frosted: coil starved into icing — by a dirty filter three times out of four, by a refrigerant leak the rest.
- **Common failure modes:** Icing (from low airflow or low charge), dirt matting the fins (slow capacity loss, musty smell), and formicary corrosion pinholes that leak refrigerant — the classic reason older systems 'need a top-off' every spring.

### Refrigerant Circuit (aka Line set, Charge, Freon loop)

The sealed copper loop — coil, compressor, condenser, metering device, and two connecting lines — that moves heat from inside your house to outside it.

Refrigerant is not fuel and is never consumed; the same charge should circulate for the system's whole life. The fat insulated line carries cool vapor to the compressor, the thin line returns high-pressure liquid, and the TXV meters it into the coil. 'Low on refrigerant' therefore always means 'has a leak.' Running undercharged drops coil temperature (ice), tanks efficiency, and slowly destroys the compressor — which is why the recharge-every-summer routine is the most expensive cheap fix in HVAC.

- **Analogy:** A conveyor belt for heat. Buckets (refrigerant) get filled indoors and dumped outdoors, around and around. Buckets don't get used up — if there are fewer buckets this year, some fell off, and topping up without fixing the hole just schedules the next failure.
- **Example:** Cooling that fades over three weeks, oil staining a flare fitting, frost creeping up the suction line: a slow leak, not a thirsty system.
- **Common failure modes:** Leaks at coil corrosion pinholes and line fittings (oil stains are the tell), a sticking TXV starving or flooding the coil, and chronic undercharge quietly cooking the compressor.

### Compressor

The pump at the heart of the refrigerant loop: it squeezes low-pressure vapor into hot, high-pressure vapor so the heat collected indoors can be dumped outdoors.

The compressor is the hardest-working and most expensive component in the system — and it almost never fails first. It fails last, murdered slowly by everything else: low charge (poor cooling of its own windings), a matted condenser (chronic overheating), or a weak capacitor (brutal hard starts). That's why a good technician treats a dead compressor as the end of a story and looks for the chapters before it.

- **Analogy:** The heart of the system. And like a heart, it rarely just stops — years of high blood pressure (head pressure) and strain do it in, and by then a transplant costs more than the patient may be worth.
- **Example:** A 14-year-old condenser hums for two seconds, dims the lights, and trips the breaker. Winding test confirms a shorted compressor: the $1,800 quote versus a $5,500 new system is now a math problem, not a repair problem.
- **Common failure modes:** Hard starting and overload trips (often really a capacitor), seized or shorted windings at end of life, and slugging damage from a flooding TXV. Its failure is usually the bill for a cheaper problem ignored.

### Condenser (Coil + Fan) (aka Outdoor unit, Condensing unit)

The outdoor unit's coil and top fan, which together throw the heat collected from your house into the outdoor air.

Hot refrigerant vapor condenses back to liquid inside this coil, releasing its heat to outdoor air that the fan pulls through the fins. Its enemies are mundane: grass clippings, cottonwood fluff, dirt, and shrubs planted too close. A blocked coil raises head pressure, which cuts capacity, raises bills, and on the hottest days trips the unit off entirely — the reason so many failures happen exactly when you need cooling most.

- **Analogy:** Your car's radiator. Same job, same failure: it doesn't break so much as clog, and the engine (compressor) pays the price for it.
- **Example:** AC 'can't keep up' every July afternoon. The fins are a felt blanket of cottonwood. One gentle hose-out from the inside, capacity returns like a software update.
- **Common failure modes:** Fin blockage and bent fins (heat can't leave), fan motor bearings seizing (unit cooks itself in minutes), and coil damage from string trimmers and dogs.

### Capacitor & Contactor (aka Run cap, Relay)

The outdoor unit's two small electrical parts: the capacitor gives its motors the jolt to start spinning, and the contactor is the relay that feeds the unit power at all.

Between them, these two $20–$45 parts explain the majority of outdoor-unit failures. Capacitors dry out with heat and age — the compressor and fan then hum without starting. Contactor points arc on every cycle until they burn (no power) or weld (unit never shuts off). Both are quick pro fixes; the capacitor is also genuinely hazardous DIY, because it stores a charge after the power is off.

- **Analogy:** The starter motor and ignition switch of a car. When either fails, the engine is perfectly fine — it just cranks and clicks, or gets no juice at all.
- **Example:** Outdoor unit hums, clicks off, hums again; fan starts when nudged with a stick through the grille. Textbook failed capacitor — a $200 visit, not a $2,000 one.
- **Common failure modes:** Capacitor bulge/leak (hum, no start — the #1 AC repair in the country), burned contactor points (dead unit), welded points (unit runs with the thermostat off).

### Condensate Pan & Drain

The pan and pipe that carry away the gallons of water your AC wrings out of the air daily — with a float switch that shuts the system down if they back up.

A central AC can pull 5–20 gallons of water out of humid air per day, all of which must drain through one narrow, algae-prone line. When it clogs, either water overflows (the mystery ceiling stain under an attic unit) or the float switch cuts the whole system dead. That switch interrupts the same 24-volt circuit as the thermostat — which is why a clogged drain perfectly impersonates a dead system.

- **Analogy:** A gutter and downspout for your air. Nobody thinks about it until it clogs, and then the damage happens somewhere that looks unrelated.
- **Example:** AC quits on the most humid week of the year, no error anywhere. Pan full, float switch tripped. A wet/dry vac on the outdoor drain stub pulls out a plug of algae; system returns from the dead.
- **Common failure modes:** Algae clogs (overflow or float-switch shutdown), cracked or rusted pans on older units, and pump failures where gravity drainage isn't possible.

### Burners & Heat Exchanger

The furnace's core: gas burners heat a sealed metal passage, air heats up passing over its outside, and combustion gases stay separated from the air you breathe.

That separation is the entire safety design of a gas furnace. The exchanger flexes with every heat cycle for 15–25 years until metal fatigue cracks it — at which point combustion byproducts, including carbon monoxide, can mix into supply air. This is the one fault on this page that is about life safety rather than comfort, and the reason a CO detector belongs near every furnace and bedroom. It's also, unfortunately, a classic pressure-sales diagnosis — always ask to see camera evidence of the crack.

- **Analogy:** A campfire behind glass. You want the warmth radiating through; you absolutely do not want a crack in the glass letting smoke into the room.
- **Example:** A 20-year-old furnace, a CO alarm at 2 a.m., and a flame that flutters when the blower kicks on: shut it down, ventilate, and get eyes on the exchanger before it runs again.
- **Common failure modes:** Fatigue cracks (CO risk — shut down now), overheating from airflow neglect accelerating that fatigue, and on the ignition side: dirty flame sensors and cracked igniters causing no-heat lockouts.

## The five paths every failure lives on

The most useful way to segment an HVAC system isn't by room or by part — it's by **path**: the five flows the machine maintains (air, refrigerant, electricity & control, combustion, water). Every component belongs to a path, every fault lives where its components live, and every diagnosis is really the question *"which path is broken?"* The part labels in the 3D model above are color-coded by these paths.

### Airflow path

The air loop: room air returns through the ducts, gets filtered, is pushed by the blower across the coil (cooling) or heat exchanger (heating), and travels back out the supply ducts. Every BTU the system makes rides this path to reach you.

Flow: Ductwork & Registers -> Air Filter -> Blower Motor & Wheel -> Burners & Heat Exchanger -> Evaporator Coil (A-Coil) -> Flex Duct (Attic Silver Duct)
How it fails: Starvation. A clogged filter, dying blower, or crushed/leaky duct chokes the air — and the starved coil ices, the furnace overheats, and rooms go uneven. Most airflow fixes are DIY.

### Refrigerant path

The sealed heat conveyor: the compressor drives refrigerant through the condenser, liquid line, TXV, and evaporator coil, moving heat out of the house in summer (and into it, on a heat pump, in winter).

Flow: Compressor -> High/Low-Pressure Switches -> Reversing Valve (Heat Pump) -> Condenser Coil -> Condenser Fan -> Service Valves & Gauge Ports -> Refrigerant Lines -> Metering Device (TXV) -> Evaporator Coil (A-Coil)
How it fails: Leaks and starvation. Low charge ices the coil and cooks the compressor; a blocked condenser or dead fan spikes pressure until the system trips. Everything on this path is licensed-pro territory (EPA 608).

### Electrical & control path

The chain of command: breaker and disconnect feed power; the thermostat and control board decide who runs; the contactor switches the outdoor unit; the capacitor kick-starts its motors; on heat pumps, the board also stages the auxiliary heat strips.

Flow: Breaker & Disconnect -> Service Wiring & Whip -> Furnace Service Switch (SSU) -> Blower Door Safety Switch -> 24V Transformer -> Thermostat -> Outdoor Air Temperature Sensor -> Defrost / Coil Sensor (Heat Pump) -> Control / Defrost Board -> Contactor -> Run Capacitor -> Auxiliary Heat Strips
How it fails: Lies and dead switches. A dead capacitor hums, a welded contactor never shuts off, and a faulty sensor board silently latches 4–5x-cost emergency heat all winter. Cheap parts, expensive symptoms.

### Combustion path

The fire side of a gas furnace: igniter lights the burners, the flame sensor proves it, and the heat exchanger passes the heat to air while keeping exhaust sealed away from it.

Flow: Inducer / Draft Fan -> Igniter & Flame Sensor -> Gas Line, Shutoff & Drip Leg -> Gas Valve -> Burners & Heat Exchanger -> High-Limit & Rollout Switches -> Flue / Vent & Intake Piping -> Furnace Condensate Trap
How it fails: Ignition lockouts and — the one true emergency — a cracked heat exchanger leaking carbon monoxide. Flame-sensor cleaning is routine; anything else on this path is a pro call, and CO signs mean leave first.

### Drainage path

The water exit: the cooling coil condenses gallons a day out of the air; the primary pan and drain line carry it out, the emergency pan underneath catches what the primary misses, and the float switch stands guard over both.

Flow: Evaporator Coil (A-Coil) -> Primary Pan & Drain Line -> Drain Cleanout Tee -> Condensate Pump -> Emergency Drain Pan -> Float Switch
How it fails: Clogs. Algae blocks the line, water backs into the pans, and the float switch kills the whole system — the classic 'dead AC' that's actually a $0 fix. A dripping outdoor outlet is this path's health check.

## Real service calls, replayed

First, two healthy baselines — the cooling start-up from breaker to cold air, and the gas heat cycle with its deliberate delays — because every diagnosis is a comparison against how it should work. Then complete real incidents — from first symptom to fix confirmed — that you can **replay step-by-step in the 3D model above** (Scenarios tab). Each step lights up the parts involved and shows what the system is doing at that moment, including the detail most people miss: **watching the outdoor drain outlet drip is how you confirm a condensate system is healthy**.

### Cooling start-up: from the breaker panel to cold air

The healthy baseline. Every fault on this page is a break somewhere in this exact chain — know the chain and you know where to look.

1. **Power waits at the panel.** Two circuits leave the breaker panel: 240V for the outdoor condenser (through the pull-out disconnect and the whip conduit) and 120V for the furnace — through the service switch on the garage or attic wall that everyone mistakes for a light switch. Right now everything is energized but idle — nothing runs until something asks.
2. **The transformer makes the control voltage.** Inside the air handler, a small transformer steps 120V down to 24V. This 24V is the system's nervous system: every thermostat wire, float switch, door switch, and relay coil speaks it. Big power moves nothing until small power gives the order.
3. **You lower the set point.** The thermostat compares room temperature to your target and closes two 24V circuits: Y (cooling) and G (fan). That's all a thermostat is — a temperature-operated switch. The 'call' travels down the thin copper wires toward the equipment.
4. **The board checks the safeties.** The control board passes the call through the safety chain: condensate float switch not tripped, door panel seated, limits closed. Any one of them open and the start dies right here — which is exactly why a full drain pan impersonates a dead system.
5. **The contactor slams in outside.** 24V reaches the contactor's coil at the condenser; it pulls 240V contacts closed with an audible clunk. High voltage now floods the outdoor unit through the whip. This clunk-then-hum is the sound of a healthy start.
6. **The capacitor kick.** The compressor and condenser fan are single-phase motors — they can't start themselves. The run capacitor provides the phase-shifted jolt that snaps them into rotation. Fan spins up top, compressor thumps alive below. (When this part dies, you get hum-click-silence instead.)
7. **The refrigerant loop comes alive.** The compressor squeezes refrigerant hot and shoves it through the condenser coil (heat leaves out the top with the fan's air). The liquid line carries it back indoors, the TXV meters it into the evaporator coil, and the coil surface drops to ~40°F.
8. **The blower moves the house through it.** Indoors, the blower pulls room air through the return and filter and pushes it across that cold coil. Heat and humidity transfer into the refrigerant; the air leaves ~20°F cooler than it arrived.
9. **Cold air rides the ducts — and water starts to drip.** Supply air climbs the plenum, rides the trunk, and branches through the silver flex ducts to every register. Meanwhile the humidity condensing on the coil starts dripping down the drain line — within minutes the outdoor drain outlet drips steadily. Both flows moving = system healthy.
10. **Satisfied — and the shutdown order.** Room reaches set point; the thermostat opens Y. The contactor drops, the outdoor unit stops, and the blower runs ~60–90 seconds longer to harvest the cold left in the coil. Most stats then enforce a 5-minute anti-short-cycle delay. A healthy cycle is 10–20 minutes — much shorter, look up 'short cycling' below.

**Takeaway:** That chain — breaker → transformer → thermostat → safeties → contactor → capacitor → refrigerant loop → blower → ducts → drain — is the whole machine. Every fault in the library below is one of these links breaking, and the diagnose tab is really asking: which link?

### Gas heat cycle: from the W call to warm vents

The healthy heating baseline for a gas furnace — including the deliberate delays people mistake for problems.

1. **The W call and the pre-purge.** Thermostat closes R→W. The board doesn't light anything yet: first the inducer fan runs ~30–60 seconds, proving draft and purging old gas from the heat exchanger. This pause is by design — not a fault.
2. **The igniter glows, gas flows.** The hot-surface igniter heats to orange (~2500°F), the gas valve opens, and the burners light with a soft whoosh. Flames fire down the heat exchanger tubes.
3. **The flame sensor proves it — in 3 seconds.** A thin rod in the flame must report combustion within seconds or the board slams the gas valve shut. Light-then-die-then-retry (three tries → lockout) is the signature of this sensor needing its annual cleaning.
4. **The blower waits, then delivers.** The blower deliberately waits 30–60 seconds while the exchanger warms — this is why heat doesn't arrive the instant the furnace fires. Then it pushes air across the hot metal and warm air rides the same ducts and silver flex runs to every room.
5. **Satisfied — and the cool-down.** Set point reached, burners stop, and the blower keeps running until the exchanger cools. Air from the vents turning cool for the last minute of a cycle is normal harvest, not a failure — cold air for whole cycles is (see 'furnace blowing cold air' in the FAQ).

**Takeaway:** Pre-purge pause, ignition, 3-second flame proof, blower delay, cool-down harvest: five deliberate stages, three of which get reported as 'my furnace is broken.' Know the healthy rhythm and the real faults stand out immediately.

### A heat pump on a 20°F day — including the defrost 'scare'

The healthy winter baseline for heat pumps: what continuous running, steam plumes, and brief AUX bursts look like when nothing is wrong.

1. **Running all day IS the design.** Below the balance point (25–40°F outdoor), a heat pump runs long, nearly continuous cycles — moving 2–3 units of heat per unit of electricity the whole time. Gas-furnace intuition says 'it never shuts off, something's wrong.' Heat-pump reality: long runs at low output are exactly how it wins on efficiency.
2. **Frost grows on the outdoor coil.** Pulling heat from 20°F air drives the outdoor coil below freezing, and humidity frosts onto it — a thin, even white coat is completely normal. The defrost sensor clamped to the coil watches it build.
3. **The defrost cycle — the part that scares everyone.** Every 30–90 minutes the board flips the reversing valve: the system briefly runs in COOLING to heat the outdoor coil, the fan stops, a cloud of steam rolls off the unit, and it groans a bit. Indoors, the aux strips cover so the vents don't blow cold. Five minutes later it's back to heating. Steam plume + brief AUX = the system working, not failing.
4. **AUX in bursts, not as a lifestyle.** On the coldest days the room may sag ~2°F below set point and stage the strips in for recovery bursts. Healthy pattern: AUX flickers on, catches up, drops out. The failure patterns are the extremes — AUX constantly lit on a mild day (stuck on, 3–5x bills) or never engaging during a cold snap while the house loses ground (strips dead).
5. **What's NOT normal in winter.** A solid ice SHELL on the outdoor unit for days (defrost failure), ice climbing the refrigerant lines with weak heat (low charge), steam-plume defrosts every few minutes (lying sensor), or supply air that never exceeds lukewarm in a cold snap (dead strips). Each of those is in the fault library below — everything you watched in this sequence is not.

**Takeaway:** Continuous low-and-slow running, light even frost, periodic steamy defrosts with brief AUX cover, and burst-mode aux on brutal days: that's a healthy heat pump winter. Memorize this rhythm and the two real failures — AUX stuck on (the 5x bill) and AUX dead (the cold-snap emergency) — stand out immediately.

### The attic pan filled with water — and everything went dead

AC completely dead on a humid day. Up in the attic, the emergency pan under the unit is full of standing water.

1. **Humidity becomes water.** While cooling on a humid day, the evaporator coil wrings 5–20 gallons of water out of the air. Every drop has to leave through one narrow drain line — watch it drip at the outdoor outlet while the system runs.
2. **The drain clogs, the pan fills.** Algae builds up in the drain line until water can't pass. It backs up into the primary pan, overflows into the emergency pan, and rises toward the float switch. Outside, the drain outlet has gone dry — the first clue nobody notices.
3. **The float switch pulls the plug.** The float lifts and opens the 24-volt control circuit — the same circuit the thermostat uses to call for cooling. The ENTIRE system goes silent: no blower, no outdoor fan, no error message. It looks like a dead AC. It's actually a safety device doing its job, protecting your ceiling.
4. **Clear the water — it wakes right up.** Empty the pan and pull the clog (a wet/dry vac sealed on the outdoor drain stub works best). The float drops, the circuit closes, the thermostat's call gets through — blower spins up indoors, the outdoor fan kicks on. Nothing was ever 'broken.'
5. **Confirm at the drain outlet.** The proof it's fixed: steady droplets at the outdoor drain termination while cooling on a humid day. Dripping drain = flowing drain. If it runs dry again within days, the clog is re-forming and the line needs a proper clean-out.

**Verdict:** A clogged condensate drain tripping the float switch — the #1 cause of 'my AC died on the hottest day' calls that end with a $0 fix. Prevention: vacuum the line each spring and a cup of distilled vinegar in the cleanout tee monthly in cooling season. One caution: a drain stub terminating over a window or soffit is the EMERGENCY line — dripping there is the warning, not the health check.

### The outdoor unit hums, clicks… and never starts

Indoor blower runs and air moves, but it's warm. Outside, the unit buzzes for a few seconds, clicks off, and tries again — the fan on top never spins.

1. **The call goes out.** The thermostat calls for cooling. Indoors everything is normal — the blower runs and pushes air. But that air never gets cold, because cooling only happens if the outdoor unit joins in.
2. **Hum… click… silence.** At the outdoor unit: the contactor clicks in and power arrives, but the compressor and fan just hum without turning. After a few seconds their overload protection gives up. A pause, then it tries again. That hum is a motor pushing against a dead start circuit.
3. **The stick test.** The classic field check: nudge the fan blade with a stick through the top grille (never fingers). If the fan spins up and keeps going, the motors are fine — the run capacitor that gives them their starting kick is dead. A bulged or leaking capacitor top confirms it on sight.
4. **Why you stop running it.** Every failed start slams the compressor with locked-rotor current — the electrical equivalent of flooring a car in park. Shut cooling off until it's fixed. A capacitor is a $150–$400 pro visit; the compressor it protects is a $2,000+ one. (Capacitors hold a lethal charge after power-off — this is not the DIY one.)

**Verdict:** A failed run capacitor — the single most-replaced part in residential AC. Cheap, fast, and dangerous only if you open the panel yourself. Book the repair, keep the system off, and the compressor lives to see another decade.

### Ice on the copper line in the middle of July

Cooling has gotten weaker for days. Airflow at the vents is feeble, and there's frost — actual ice — on the big insulated copper line at the indoor unit.

1. **The slow suffocation.** A filter that's months overdue chokes the return airflow. The blower moves less and less warm air across the evaporator coil — and a coil that isn't fed warm air runs colder and colder, past 32°F.
2. **Ice feeds on itself.** Moisture in the air freezes onto the cold coil instead of draining away. Ice blocks airflow further, which makes the coil colder, which makes more ice — until the coil is a solid block, frost creeps up the suction line, and almost no air leaves the vents.
3. **Thaw first, always.** Cooling OFF, fan ON. Give it 2–4 hours (towels under the unit — that ice becomes water in the pan). Running it frozen risks liquid refrigerant slugging back into the compressor, which turns a $10 problem into a four-figure one.
4. **New filter, moment of truth.** Fresh filter in, cooling back on. Strong airflow returns and the lines stay dry: case closed, it was airflow all along. If ice comes back with a clean filter and a strong blower — the other thing that starves a coil is a refrigerant leak, and that one's a pro call.

**Verdict:** A clogged air filter froze the coil — the most common self-inflicted failure in HVAC. The $10 rectangle you forgot protects the blower, the coil, and the compressor. Set a calendar reminder: 1-inch filters every 1–3 months.

### The winter electric bill that hit 5x — with nothing 'broken'

All-electric heat pump home. House perfectly warm all winter, system quiet — and then a monthly electric bill 4–5x higher than comparable homes. A hired consultant eventually finds it.

1. **How a heat pump is supposed to heat.** In heating mode the refrigerant loop runs in reverse: the compressor moves heat from outdoor air into the house, delivering roughly 3 units of heat per unit of electricity. This is the cheap mode — the one you're supposed to live on.
2. **The backup nobody should feel.** Inside the air handler sit auxiliary heat strips — pure electric resistance, glowing like a giant toaster. They exist for deep cold and defrost cycles, delivering 1 unit of heat per unit of electricity: 3–5x the cost per degree. Designed to run minutes, not months.
3. **A sensor board starts lying.** The defrost/control board reads the outdoor sensor to decide when strips are allowed. This one misreads — and latches auxiliary heat on. The strips now carry the load the compressor should. The house is warm. Nothing rattles, nothing leaks, no error code shows. The failure is completely silent.
4. **The bill IS the symptom.** kWh usage runs 4–5x comparable homes. The one visible clue sits on the thermostat: AUX HEAT or EM HEAT lit on a mild afternoon, when a healthy system wouldn't dream of touching the strips. Most people never look.
5. **What the consultant actually did.** Clamp meter on the strip circuit: 40+ amps drawn during ordinary heating — strips running when they shouldn't. Board's sensor reading compared against a real thermometer: off by 25 degrees. Faulty sensor board replaced, aux lockout set above 35°F, and the next bill drops back to normal. The fix paid for itself in one cycle.

**Verdict:** A faulty defrost/sensor board latching emergency heat on — the most expensive failure a heat pump can have precisely because nothing feels broken. If your winter bill jumps 3–5x with an all-electric system: check the thermostat for a constantly-lit AUX/EM indicator, then have the sensor board and strip amp draw tested. $150–$650 in parts against hundreds per month in waste.

## Symptom → most likely causes

The same lookup the diagnoser runs, flattened to a table: each symptom, ranked by how often each cause turns out to be the answer on real service calls. Multiple symptoms narrow it fast — that's what the interactive mode above is for.

- **AC runs but blows warm air** -> **Clogged air filter** is the most common cause; also check: Failed run capacitor, Dirty / blocked condenser coil.
- **System won't turn on at all** -> **Tripped breaker / pulled disconnect** is the most common cause; also check: Clogged condensate drain, Thermostat dead or misconfigured.
- **Weak or no airflow from vents** -> **Clogged air filter** is the most common cause; also check: Frozen evaporator coil, Leaky or unbalanced ductwork.
- **Starts and stops every few minutes** -> **Clogged air filter** is the most common cause; also check: Failed run capacitor, Clogged condensate drain.
- **Ice on refrigerant lines or coil** -> **Clogged air filter** is the most common cause; also check: Refrigerant leak / low charge, Frozen evaporator coil.
- **Water around the indoor unit** -> **Clogged condensate drain** is the most common cause; also check: Frozen evaporator coil, Furnace condensate trap clogged (winter water).
- **Indoor blower runs, outdoor unit silent** -> **Failed run capacitor** is the most common cause; also check: Tripped breaker / pulled disconnect, Thermostat dead or misconfigured.
- **Outdoor unit hums or clicks, won't start** -> **Failed run capacitor** is the most common cause; also check: Pitted or stuck contactor, Compressor failing or seized.
- **Grinding, screeching, or banging** -> **Condenser fan motor failure** is the most common cause; also check: Blower motor failure, Condensate pump failed or clogged.
- **Burning or electrical smell** -> **High-limit or rollout switch tripping** is the most common cause; also check: Blower motor failure, Cracked heat exchanger.
- **Energy bills noticeably higher** -> **Clogged air filter** is the most common cause; also check: Dirty / blocked condenser coil, Refrigerant leak / low charge.
- **Some rooms hot, some cold** -> **Leaky or unbalanced ductwork** is the most common cause; also check: Crushed, kinked, or disconnected flex duct, Oversized or poorly matched system.
- **Runs constantly, never hits set temp** -> **Clogged air filter** is the most common cause; also check: Thermostat dead or misconfigured, Dirty / blocked condenser coil.
- **Furnace runs but air isn't warm** -> **Clogged air filter** is the most common cause; also check: Dirty flame sensor, Thermostat dead or misconfigured.
- **Furnace clicks but never fires up** -> **Dirty flame sensor** is the most common cause; also check: Cracked hot-surface igniter, Furnace condensate trap clogged (winter water).
- **Winter electric bill 3–5x normal** -> **Refrigerant leak / low charge** is the most common cause; also check: Aux/emergency heat stuck on (faulty sensor board), Defrost failure — outdoor unit becomes an ice block.
- **Thermostat shows AUX/EM HEAT constantly** -> **Aux/emergency heat stuck on (faulty sensor board)** is the most common cause.
- **Outdoor unit caked in ice (winter)** -> **Refrigerant leak / low charge** is the most common cause; also check: Defrost failure — outdoor unit becomes an ice block.
- **House cool but humid / clammy** -> **Dirty evaporator coil / blower wheel** is the most common cause.
- **Musty smell when it runs** -> **Dirty evaporator coil / blower wheel** is the most common cause.
- **I smell gas / rotten eggs** -> **undefined** is the most common cause.
- **CO alarm went off** -> **undefined** is the most common cause.

## The complete fault library

All 35 faults in the ontology: what causes each, what to check in order, the realistic fix, and typical US repair costs (2026). Severity is honest about the DIY line — **refrigerant, gas, and line voltage are licensed-pro territory**, both legally and practically.

| Fault | Severity | Symptoms | Components | First check | Fix and typical cost |
|---|---|---|---|---|---|
| Clogged air filter | DIY-friendly | Weak or no airflow from vents / Ice on refrigerant lines or coil / AC runs but blows warm air / Starts and stops every few minutes / Energy bills noticeably higher / Runs constantly, never hits set temp / Furnace runs but air isn't warm | Air Filter / Blower Motor & Wheel / Evaporator Coil (A-Coil) | Pull the filter and hold it up to a light — if you can't see light through it, it's the problem. | Replace the filter (1" filters every 1–3 months, 4–5" media filters every 6–12). If the coil iced, run fan-only for a few hours to thaw before cooling again. ($5–$40 DIY) |
| Thermostat dead or misconfigured | DIY-friendly | System won't turn on at all / Indoor blower runs, outdoor unit silent / Starts and stops every few minutes / Runs constantly, never hits set temp / Furnace runs but air isn't warm | Thermostat | Is the screen on? Replace batteries if blank or flashing low-batt. | Batteries, correct settings, or a replacement thermostat. A basic replacement is one of the safest DIY electrical jobs (low voltage) if you photograph the wiring first. ($0–$150 DIY · $250–$500 installed smart stat) |
| Tripped breaker / pulled disconnect | DIY-friendly | System won't turn on at all / Indoor blower runs, outdoor unit silent | Breaker & Disconnect | At the panel, find the AC/furnace breakers — a tripped one sits between ON and OFF. Flip fully OFF, then ON. | A one-time reset is fine. Repeat trips mean a pro visit: repeatedly resetting into a fault can turn a $30 part into a $2,000 compressor. ($0 DIY reset · repeat trips: diagnostic call $100–$200) |
| Failed run capacitor | Call a pro | Outdoor unit hums or clicks, won't start / AC runs but blows warm air / Indoor blower runs, outdoor unit silent / Starts and stops every few minutes | Run Capacitor / Compressor / Condenser Fan | Listen at the outdoor unit for a hum or click every few minutes with no fan movement. | A technician discharges and swaps the capacitor, matched to µF and voltage rating. Capacitors hold a charge after power-off — this is a cheap fix for a pro and a genuinely dangerous one for DIY. ($150–$400 pro (part itself is $15–$45)) |
| Pitted or stuck contactor | Call a pro | Outdoor unit hums or clicks, won't start / Indoor blower runs, outdoor unit silent / Runs constantly, never hits set temp | Contactor | Outdoor unit dead while indoor blower runs? Chattering or loud buzzing from the unit's electrical panel? | Straightforward pro replacement, often done in the same visit as a capacitor since they age together. ($150–$350 pro) |
| Refrigerant leak / low charge | Call a pro | AC runs but blows warm air / Ice on refrigerant lines or coil / Runs constantly, never hits set temp / Energy bills noticeably higher / Outdoor unit caked in ice (winter) / Furnace runs but air isn't warm / Winter electric bill 3–5x normal | Refrigerant Lines / Service Valves & Gauge Ports / Evaporator Coil (A-Coil) / Compressor / High/Low-Pressure Switches | Ice or frost on the copper lines or coil with a clean filter is the classic signature. | A pro must find and repair the leak, then weigh in the correct charge (EPA-certified work — federal law, not gatekeeping). Insist on a leak search: 'just topping off' every spring pays for a new coil in three summers. ($250–$600 leak search · recharge alone $300–$800 · $1,800–$4,500 coil (2026)) |
| Dirty / blocked condenser coil | DIY-friendly | Energy bills noticeably higher / AC runs but blows warm air / Runs constantly, never hits set temp / Starts and stops every few minutes | Condenser Coil / High/Low-Pressure Switches | Look at the fins around the outdoor unit — visible mats of fluff, dirt, or bent fins? | Kill power at the disconnect, then rinse the coil gently from the inside out with a garden hose (never a pressure washer — it folds fins like paper). Do it every spring. ($0 DIY · $100–$250 as part of a pro tune-up) |
| Condenser fan motor failure | Call a pro | Starts and stops every few minutes / AC runs but blows warm air / Grinding, screeching, or banging | Condenser Fan / Run Capacitor / High/Low-Pressure Switches | Compressor humming but fan blade still, top of the unit radiating serious heat. | Motor (and usually blade + capacitor) replacement. Shut the system off until it's fixed — every high-pressure trip is a punch to the compressor. ($300–$700 pro) |
| Frozen evaporator coil | DIY-friendly | Ice on refrigerant lines or coil / Weak or no airflow from vents / AC runs but blows warm air / Water around the indoor unit | Evaporator Coil (A-Coil) / Air Filter / Refrigerant Lines / Blower Motor & Wheel | Kill cooling, run FAN ONLY, and give it 2–4 hours to thaw (towels down). | Thaw + fix the airflow cause yourself; recurring ice with good airflow means a leak or TXV problem, which is pro territory. ($0–$40 DIY if it's airflow · else see refrigerant leak) |
| Clogged condensate drain | DIY-friendly | Water around the indoor unit / System won't turn on at all / Starts and stops every few minutes | Primary Pan & Drain Line / Drain Cleanout Tee / Emergency Drain Pan / Float Switch | Look for standing water in the pan under/beside the indoor coil. | Pull the gunk out at the outdoor end with a wet/dry vac sealed to the pipe, then pour a cup of distilled vinegar into the cleanout tee every couple of months. ($0–$20 DIY · $100–$250 pro clear-out) |
| Blower motor failure | Call a pro | Weak or no airflow from vents / Burning or electrical smell / Grinding, screeching, or banging / Furnace runs but air isn't warm / System won't turn on at all | Blower Motor & Wheel / Blower Run Capacitor (Indoor) | Thermostat calling, system 'on', but nothing from any vent. | Kill power if it smells hot. Motor or module replacement is pro work; on a 15+ year system, price it against replacement before committing. ($450–$1,500 pro (ECM modules at the high end)) |
| Dirty evaporator coil / blower wheel | Call a pro | Musty smell when it runs / House cool but humid / clammy / Weak or no airflow from vents / Energy bills noticeably higher / Runs constantly, never hits set temp | Evaporator Coil (A-Coil) / Blower Motor & Wheel / Air Filter | Musty or dirty-sock smell that starts when the blower kicks on — not constant — points at the wet indoor coil. | A pro pulls and cleans the blower wheel and washes the coil in place. Not hazardous, but fins and wheel balance are easy to ruin — and it's exactly the $150–$400 fix that prevents a misdiagnosed $1,500 blower motor or 'needs freon' call. ($150–$400 pro cleaning · $40/yr of filters prevents it) |
| Leaky or unbalanced ductwork | Call a pro | Some rooms hot, some cold / Energy bills noticeably higher / Weak or no airflow from vents / Runs constantly, never hits set temp | Ductwork & Registers | Are the uncomfortable rooms the ones farthest from the furnace? | Seal accessible joints with mastic (not 'duct tape', which ironically fails on ducts), then have a pro balance or pressure-test the system. Sealing is one of the highest-ROI fixes in HVAC. ($20–$60 DIY mastic · $500–$2,000 pro seal & balance) |
| Compressor failing or seized | Call a pro | Outdoor unit hums or clicks, won't start / AC runs but blows warm air / Grinding, screeching, or banging / Energy bills noticeably higher / Indoor blower runs, outdoor unit silent | Compressor | Loud clunk + lights dimming at start, breaker trips, or a hum that shuts off on internal overload. | On a system under ~10 years, compressor replacement can make sense (often under parts warranty). Older than that, put the money toward a new condenser or full system instead. ($1,500–$3,000 replace compressor · $6,500–$12,000 new system (2026 A2L)) |
| TXV stuck or failed | Call a pro | Ice on refrigerant lines or coil / AC runs but blows warm air / Runs constantly, never hits set temp | Metering Device (TXV) / Evaporator Coil (A-Coil) | Icing that returns with a clean filter, strong blower, and confirmed-full charge. | Valve replacement — brazing and a full evacuation/recharge, firmly pro work. ($450–$1,200 pro) |
| Dirty flame sensor | DIY-friendly | Furnace clicks but never fires up / Furnace runs but air isn't warm / Starts and stops every few minutes | Igniter & Flame Sensor / Burners & Heat Exchanger | Watch a heat cycle through the sight glass: ignition, brief flame, shutdown = flame sensor until proven otherwise. | A pro cleans the rod with fine abrasive in minutes; comfortable DIYers do it too (power and gas off, one screw). It's maintenance, not a defect — annual cleaning prevents it. ($0 DIY clean · $100–$250 pro visit) |
| Cracked hot-surface igniter | DIY-friendly | Furnace clicks but never fires up / Furnace runs but air isn't warm | Igniter & Flame Sensor | Watch startup: inducer fan spins, then — no orange glow where the burners are — gas never opens. | Inexpensive part, delicate swap (touching the new element with bare fingers shortens its life). Reasonable for a careful DIYer with gas off; cheap for a pro. ($25–$60 part · $150–$350 pro) |
| Cracked heat exchanger | Safety — act now | Burning or electrical smell / Furnace runs but air isn't warm / Starts and stops every few minutes | Burners & Heat Exchanger | CO alarm, soot streaks, a flame that dances when the blower kicks on, or a persistent chemical smell: shut the furnace off now. | Furnace off until verified. A confirmed crack on an old furnace means replacement; exchangers carry long warranties but the labor usually makes a new unit smarter. ($2,000–$3,500 exchanger job · $3,500–$7,500 new furnace) |
| Blower door not seated (door switch open) | DIY-friendly | System won't turn on at all | Blower Door Safety Switch | Did anyone change the filter or remove a panel recently? Press the blower door firmly inward — if the system springs to life, done. | Re-seat the door. A worn switch is a cheap part; a bypassed one is a hazard (it exists so nobody meets a spinning blower or live board barehanded). ($0 DIY · $75–$150 pro switch swap) |
| Furnace condensate trap clogged (winter water) | DIY-friendly | Furnace runs but air isn't warm / Furnace clicks but never fires up / Water around the indoor unit | Furnace Condensate Trap / Inducer / Draft Fan / Flue / Vent & Intake Piping | 90%+ furnace (white PVC vent pipes) locking out in cold weather with pressure-switch codes? Suspect the trap before the switch. | Pull the trap, flush it and its hoses with warm water, reinstall. Ten minutes, most cabinets. Make it an every-fall ritual on condensing furnaces, same as vinegar in the AC drain every summer. ($0 DIY flush · $150–$300 pro visit) |
| Service switch off / blown SSU fuse | DIY-friendly | System won't turn on at all / Furnace runs but air isn't warm | Furnace Service Switch (SSU) / 24V Transformer | Find the switch on or within sight of the furnace (garage wall, attic entry, closet door frame) — is it ON? Flip it and listen for the board/transformer to come alive. | Flip it back on, or replace the fuse. If the fuse blows again, there's a real short downstream — see 'control short.' Consider labeling the switch 'FURNACE — DO NOT TURN OFF.' ($0 DIY · $2–$5 fuse) |
| High-limit or rollout switch tripping | Call a pro | Starts and stops every few minutes / Furnace runs but air isn't warm / Burning or electrical smell | High-Limit & Rollout Switches / Air Filter / Blower Motor & Wheel / Burners & Heat Exchanger | Burners cutting out while the blower keeps running, on a repeating cycle = limit trips. Check the filter first, then open registers. | Fix the airflow cause yourself (filter, vents). Weak/aging limit switches and anything rollout-related is pro work — rollout trips can be the smoke before the cracked-heat-exchanger fire. ($0–$40 DIY airflow · $150–$400 pro switch/diagnosis) |
| Condensate pump failed or clogged | DIY-friendly | Water around the indoor unit / System won't turn on at all / Grinding, screeching, or banging | Condensate Pump / Float Switch | Water around a small plastic box beside the indoor unit — lift its lid: sludge and a stuck float are usually staring back. | Rinse the reservoir and float annually; a replacement pump is a $50–$80 part with two hose clamps and a plug — honest DIY. Route the discharge line so it can't kink. ($0–$80 DIY · $150–$300 pro) |
| Reversing valve stuck or leaking | Call a pro | Furnace runs but air isn't warm / AC runs but blows warm air / Energy bills noticeably higher / Runs constantly, never hits set temp | Reversing Valve (Heat Pump) / Control / Defrost Board / Compressor | Heat pump blowing the wrong temperature for the mode — after confirming the thermostat isn't simply set wrong (O/B wire setting matters here). | Solenoid coil is a cheap swap; a stuck or leaking valve body means recovery, brazing, and recharge — solidly pro. On old units, price it against replacement. ($100–$250 solenoid · $600–$1,500 valve body) |
| Float switch tripped or stuck | DIY-friendly | System won't turn on at all / Starts and stops every few minutes | Float Switch / Emergency Drain Pan / Primary Pan & Drain Line | System dead in cooling season: find the small switch on the pan or drain line and check for water first — water means the drain is the real problem. | Re-seat, clean, or replace the switch ($15–$30 part, two wires, 24V). If it tripped on real water, clear the drain clog — the switch worked. ($0–$30 DIY · $100–$200 pro) |
| Inducer fan / pressure switch failure | Call a pro | Furnace clicks but never fires up / Furnace runs but air isn't warm | Inducer / Draft Fan / Flue / Vent & Intake Piping / Control / Defrost Board | On a heat call, listen for the pre-ignition whir (30–60s before anything else). Silence = inducer or its power; whir but no ignition sequence = pressure switch or blocked venting. | Clear blocked venting yourself; a failed inducer motor or pressure switch is a pro replacement. ($0 DIY vent clearing · $150–$350 pressure switch · $400–$900 inducer) |
| Gas valve not opening | Call a pro | Furnace clicks but never fires up / Furnace runs but air isn't warm | Gas Valve / Gas Line, Shutoff & Drip Leg / Control / Defrost Board | First, the zero-dollar check: is the manual gas shutoff beside the furnace OPEN (handle parallel to the pipe)? Closed after other work is the classic impersonator of this fault. | Valve replacement, gas-side work — licensed pro only, no exceptions. If you ever smell gas: leave first, call from outside. ($300–$700 pro) |
| Control short — blown transformer or board fuse | Call a pro | System won't turn on at all | 24V Transformer / Service Wiring & Whip / Thermostat / Control / Defrost Board | Breakers ON but thermostat completely blank (and batteries are good): suspect the 24V side. | Find and repair the shorted wire (splice/re-run), then replace the fuse or transformer. Cheap parts; the diagnosis is the work. ($5 fuse · $80–$250 transformer · plus finding the short) |
| Damaged low-voltage wires at the outdoor unit | DIY-friendly | Indoor blower runs, outdoor unit silent / System won't turn on at all / Starts and stops every few minutes | Service Wiring & Whip / Contactor | Inspect the thin wires where they leave the house and enter the condenser — look for nicks, bare copper, green corrosion. | Cut back to clean copper, splice with weatherproof connectors or re-run the short outdoor section, and sleeve it in conduit so it doesn't happen again. One of the few genuinely DIY-able electrical fixes (it's 24V). ($5–$20 DIY · $150–$300 pro visit) |
| Crushed, kinked, or disconnected flex duct | DIY-friendly | Weak or no airflow from vents / Some rooms hot, some cold / Energy bills noticeably higher / Runs constantly, never hits set temp | Flex Duct (Attic Silver Duct) / Ductwork & Registers | One specific room starved while others are fine points at that room's flex run, not the equipment. | Re-suspend sagging runs, replace crushed sections (flex is cheap), re-clamp and mastic-seal slipped connections, and keep bends gentle. This is honest DIY territory for anyone comfortable in an attic. ($20–$60 DIY per run · $200–$500 pro) |
| Frozen condensate line (condensing furnace) | DIY-friendly | Furnace runs but air isn't warm / Furnace clicks but never fires up / Water around the indoor unit | Primary Pan & Drain Line / Furnace Condensate Trap / Condensate Pump | No-heat during a hard freeze on a 90%+ furnace (white PVC pipes), with pressure-switch codes: before blaming the trap, follow the little vinyl/PVC drain line — does it pass through unheated space? | Thaw it gently, then fix the routing: re-slope so nothing pools, insulate or heat-tape the cold-space run, or reroute to an interior drain. The thaw is DIY; making it never happen again is an afternoon with pipe insulation. ($0 thaw · $20–$60 insulation/heat tape · $150–$350 pro reroute) |
| Backup heat strips dead (burned element / blown links) | Call a pro | Furnace runs but air isn't warm / Runs constantly, never hits set temp | Auxiliary Heat Strips / Control / Defrost Board / Breaker & Disconnect | Heat pump running nonstop in a cold snap, house slowly LOSING ground, supply air only lukewarm (90–100°F, never the 105–125°F strip boost). | A pro tests elements, fusible links, and the sequencer, and replaces the dead bank. Do the EM HEAT test on the first cool fall day — not at midnight in January. ($150–$300 element/link · $200–$450 sequencer · strips have their own breaker: $0 reset) |
| Aux/emergency heat stuck on (faulty sensor board) | Call a pro | Winter electric bill 3–5x normal / Thermostat shows AUX/EM HEAT constantly / Energy bills noticeably higher / Runs constantly, never hits set temp | Control / Defrost Board / Defrost / Coil Sensor (Heat Pump) / Outdoor Air Temperature Sensor / Auxiliary Heat Strips / Thermostat | Watch the thermostat on a mild (45°F+) day: AUX or EM HEAT showing while it maintains temperature is the tell. | Replace the faulty outdoor/defrost sensor or control board, and confirm the thermostat's staging (aux lockout above ~35–40°F, gradual recovery instead of aggressive setbacks). The repair typically pays for itself within one billing cycle. ($150–$350 sensor · $300–$650 board · $0 if it's thermostat staging) |
| Defrost failure — outdoor unit becomes an ice block | Call a pro | Outdoor unit caked in ice (winter) / Winter electric bill 3–5x normal / Furnace runs but air isn't warm / Runs constantly, never hits set temp | Control / Defrost Board / Defrost / Coil Sensor (Heat Pump) / Condenser Coil / Condenser Fan | Look at the outdoor unit after a cold night: a thin frost that clears periodically is normal, a solid ice shell is a defrost failure. | A tech tests the defrost sensor/thermostat and board, and replaces the failed part. Don't chip ice off the coil — the fins bend like paper; a garden hose on a mild day is the safe thaw. ($150–$400 sensor · $300–$650 board) |
| Oversized or poorly matched system | Call a pro | Starts and stops every few minutes / Some rooms hot, some cold / Energy bills noticeably higher | Ductwork & Registers / Thermostat | Short 5–8 minute cool cycles even in mild weather, from day one of the install (not a new development). | Band-aids: slower blower speeds, a thermostat with cycle control. Real fix: correct sizing (Manual J load calculation) at replacement time — get it in writing from any installer. ($0–$400 tuning · sizing fixed only at replacement) |

## Not all systems look like this one

The model above is a **split system** — the most common US configuration. The diagnosis logic transfers to other system types, but the layout and failure emphasis shift:

| System type | What it is | How it heats & cools | Layout | Where you'll find it | Best for | Watch out for |
|---|---|---|---|---|---|---|
| Split system (AC + furnace) | The system modeled on this page: outdoor condenser, indoor gas furnace with coil on top | Gas burns for heat; refrigerant loop cools | Outdoor unit + indoor cabinet joined by two refrigerant lines and ducts | Most existing US single-family homes | Cold-winter regions with gas service; cheapest to repair | Two fuel bills; ducts leak 20–30% in typical homes |
| Air-source heat pump | A split system whose refrigerant loop runs both directions | One refrigerant loop both heats and cools | Same layout as a split, plus a reversing valve; often electric backup strips | The default in new builds and electrification retrofits | Mild-to-cold climates (modern units work below 0°F); one all-electric bill | Backup heat strips can spike bills if sized or set up wrong |
| Ductless mini-split | Small outdoor unit feeding wall-mounted indoor heads, no ducts | Heat-pump loop, one head per zone | 1 outdoor unit → 1–5 indoor heads through a 3" wall sleeve | Additions, garages, old houses without ducts | Room-by-room control; no duct losses at all | A head on the wall in every room; filters in each head to clean |
| Packaged unit | Everything — coil, compressor, furnace/heat pump, blower — in one outdoor box | Same cycles, single self-contained cabinet | One rooftop or slab unit with supply and return ducts entering the building | Homes without basements/attics; most small commercial rooftops | Tight indoor space; simple single-cabinet service | All components live outdoors in the weather; shorter lifespans |
| Boiler + radiators | Hydronic heat: a boiler circulates hot water, not air | Water carries the heat; no cooling included | Boiler → pipes → radiators or in-floor loops; separate AC if you want cooling | Pre-war housing stock, much of the Northeast | Even, quiet, dust-free heat | No cooling or filtration; adding AC means a parallel system |

## The DIY line

- **Always yours:** filters, thermostat batteries and settings, one-time breaker resets, hosing the outdoor coil (power off at the disconnect first), vacuuming the condensate drain, 2 feet of clearance around the outdoor unit.
- **Judgment calls for the handy:** cleaning a flame sensor, swapping a hot-surface igniter (gas off, don't touch the element), sealing accessible duct joints with mastic.
- **Never DIY:** anything refrigerant (EPA 608 federal certification is required, and charge can't be diagnosed without gauges), capacitors and contactors (stored lethal charge), gas valves and combustion work, repeated breaker resets into a fault.
- **Leave the house first:** gas smell, or a CO alarm. Call from outside.

> **The economics of neglect:** Almost every expensive HVAC failure is a cheap one that aged. A **$10 filter** protects the blower and coil. A **$200 capacitor visit** protects the $2,000 compressor. A **$150 leak search** protects against buying refrigerant every spring and a coil in three years. The system rarely breaks — it gets broken, slowly, by deferred trivial maintenance.

## Frequently asked questions

### Why is my AC running but not cooling the house?

Work outside-in. First: is the outdoor unit actually running? If it's silent while the indoor blower runs, suspect its capacitor, contactor, breaker, or a tripped float switch. If it is running, check the air filter (the most common cause), then look for ice on the refrigerant lines and a dirt-matted outdoor coil. A clean filter, a clean coil, and no ice — but still weak cooling — points to low refrigerant from a leak, which is a pro repair. The 3D diagnoser above walks this exact sequence.

### Why is there ice on my AC lines, and what should I do?

Ice means the evaporator coil is running below freezing, which happens for exactly two reasons: not enough warm air moving across it (dirty filter, failing blower, blocked vents) or not enough refrigerant in it (a leak). Turn cooling off, run the fan only for 2–4 hours to thaw, and replace the filter. If ice comes back with a clean filter and strong airflow, stop — continuing to run it can flood-damage the compressor. That recurrence pattern means a refrigerant leak or TXV problem, both licensed-pro work.

### Why does my AC turn on and off every few minutes?

Short cycling has three common families of cause. Airflow/ice: a clogged filter freezes the coil and the system trips off repeatedly. Heat rejection: a dirty condenser coil or dead condenser fan spikes pressure until the compressor cuts out on overload — the outdoor unit will feel very hot. Control: a thermostat mounted over a lamp or supply register, or an oversized system that blasts the room and quits before doing real dehumidification. Filter and condenser coil are the two you can check yourself in ten minutes.

### Why is my outdoor AC unit humming but not starting?

That hum is almost always a motor trying to start without its run capacitor — the single most-replaced part in residential AC. The classic confirmation: if the fan spins up when nudged with a stick through the top grille, the capacitor is dead. It's a cheap, fast professional fix ($150–$400). It is not a good DIY job: capacitors store a lethal charge after power is off. Left unfixed, every failed start beats on the compressor, converting a $200 repair into a $2,000 one.

### Why is my furnace blowing cold air?

If the burners never light: on most modern furnaces that's a cracked hot-surface igniter or a board in lockout after failed attempts. If they light and die seconds later: a dirty flame sensor — the most common furnace no-heat cause, fixed by cleaning a single rod. If burners run but air still comes out cool, the blower may be moving air while a tripped limit switch (usually from a clogged filter) keeps shutting the burners down. And check the thermostat fan setting: FAN ON circulates unheated air between cycles, which feels cold and is harmless.

### How often should I really change my HVAC filter?

1-inch filters: every 1–3 months. 4–5-inch media filters: every 6–12 months. Sooner with pets, smokers, nearby construction, or wildfire smoke. The test that beats any schedule: hold it up to a light — if light doesn't pass through, air isn't either. A dirty filter is implicated in more HVAC failures than any other single cause: frozen coils in summer, limit-switch trips in winter, and early blower death year-round. It's a $10 part protecting a $10,000 system.

### Which HVAC repairs are safe to DIY, and which aren't?

Safe and worthwhile: filters, thermostat batteries and settings, one-time breaker resets, rinsing the outdoor coil (power off first), clearing the condensate drain with a wet/dry vac, and keeping 2 feet of clearance around the outdoor unit. Leave to licensed pros: anything refrigerant (federal EPA 608 rules, plus you can't diagnose charge without gauges), capacitors and other high-voltage parts (stored charge), gas-side work, and combustion diagnostics. The dividing line is simple: air and low-voltage settings are yours; refrigerant, gas, and line voltage are not.

### When does emergency heat kick in on a heat pump — and when should I worry?

Three triggers: (1) droop — the room falls about 1.5–2°F below your set point and the thermostat stages the electric strips in to help; (2) outdoor temperature below the balance point (typically 25–40°F), where the heat pump alone can't carry the house; (3) defrost cycles, which briefly energize strips so vents don't blow cold — a steam plume outside plus a few minutes of AUX is healthy. Worry when: AUX or EM HEAT shows on a mild 45°F+ day, when it runs constantly rather than in bursts, or when a winter electric bill lands 3–5x normal with a perfectly warm house — that's a lying sensor, a failed board, a welded sequencer, or aggressive setback schedules triggering strips every morning. Set your aux lockout at 35–40°F and use gradual recovery, and the strips can only rob you during real cold snaps.

### Repair or replace? How long should AC units and furnaces last?

Typical lifespans: central AC and heat pumps 12–17 years, gas furnaces 15–25. Two useful rules. The $5,000 rule: multiply the repair quote by the unit's age — over ~$5,000 (a $600 repair on a 10-year-old unit), lean replace. And any single repair over about a third of replacement cost on a unit past 12 years — especially a compressor or heat exchanger — is money better put toward new equipment, which will also cut energy use substantially. Cheap fixes (capacitors, contactors, sensors, drains) are always worth doing at any age.

**Sources and further reading:**
- [Trane — What is HVAC? (glossary)](https://www.trane.com/residential/en/resources/glossary/what-is-hvac/) (Manufacturer definitions of core HVAC terms and system types.)
- [UCF Florida Solar Energy Center — HVAC Systems](https://energyresearch.ucf.edu/consumer/buildings/hvac-systems/) (University research center's consumer guide to how residential systems work and their efficiency.)
- [Icon Mechanical — HVAC energy-efficiency tips](https://www.iconmechanicalinc.com/energy-efficiency-tips-hvac/) (Contractor-side maintenance and efficiency practices.)
- [Home Depot — Heating, Venting & Cooling](https://www.homedepot.com/b/Heating-Venting-Cooling/N-5yc1vZc4k8) (Retail reference for filters, capacitors, thermostats, and DIY-range part pricing.)

**Go deeper:**
- [Graph Types for AI Agents — the ontology pattern behind this page's fault model](https://venkatapagadala.com/guides/graph-types-for-ai-agents)

---
This is the markdown edition of [3D HVAC Troubleshooting](https://venkatapagadala.com/guides/hvac-system-troubleshooting), provided for AI assistants and answer engines. The canonical, interactive version lives at https://venkatapagadala.com/guides/hvac-system-troubleshooting.
