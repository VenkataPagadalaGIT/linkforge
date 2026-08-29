# Quantum Computer Explainer: verified knowledge base

Built 2026-08-29 for /guides/how-quantum-computers-work by a two-phase
workflow: seven research agents anchored on primary sources, then seven
hostile-referee verification agents who re-fetched sources (including the
Nielsen & Chuang and Preskill PDFs, re-deriving printed page numbers) and
corrected, tightened, or killed claims. Confidence levels are per claim.
Everything printable in src/data/quantum.ts must trace here.


## cryogenics

### Measured stage temperatures of a real dilution refrigerator (Bluefors XLD400)

Krinner et al. Table 1, measured in their Bluefors XLD400 after installation (empty fridge): 50K stage = 35 K, 4K stage = 2.85 K, Still = 882 mK, Cold plate (CP) = 82 mK, Mixing chamber (MXC) = 6 mK. The paper calls these values 'typical for state of the art pulse tube cooler based dilution refrigerators'. Under the predicted full 124-line load for a 50-qubit processor, 'The load on MXC corresponds to an operation temperature of 14 mK'. [Referee: all five temperatures, both quotes, and the 14 mK figure confirmed verbatim against the arXiv PDF; note the 14 mK is a prediction from measured per-line loads, not a directly logged 50-qubit run.]

- Source: Krinner et al., Engineering cryogenic setups for 100-qubit scale superconducting circuit systems, EPJ Quantum Technology 6:2 (2019), Table 1, Sect. 3.1 and 6
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Per-stage cooling powers (for render scale and plausibility)

Krinner et al. Table 1 (measured with pre-installed DC wiring): 30 W at 45 K (50K stage), 1.5 W at 4.2 K (4K stage), 40 mW at 1.2 K (Still), 200 uW at 140 mK (Cold plate), 19 uW at 20 mK (MXC). Two Cryomech PT420 pulse tube coolers serve the 50K and 4K stages; their manufacturer-specified AVAILABLE cooling power at the 50K stage is 40-50 W, which already accounts for a roughly 50 W radiative load from the room-temperature shield, about half the nominal cooling power of the pair. [Referee fix: original wording 'two PT420s provide 40-50 W' understated the machines; 40-50 W is the net available figure, nominal for the pair is about 100 W at that stage.]

- Source: Krinner et al. 2019, Table 1 and Section 2.3
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Vendor-official base temperature and cooling power

Bluefors LD product page (fetched 2026-08-29): 'Guaranteed Base temperature 10 mK' for both current variants; LD450 cooling power 450 uW at 100 mK and 14 uW at 20 mK; LD350 gives 350 uW at 100 mK and 12 uW at 20 mK; cooldown under 24 hours to 10 mK on an empty system; cooling power is measured from the experimental flange outside the Mixing Chamber. Bluefors application note (2021): the Mixing Chamber (MXC) Flange, 'where the quantum device is installed', 'is recorded to be 10 mK during' operation. [Referee: LD450 exists on the current page; both figures confirmed. Note the app note itself describes an LD250, a model no longer on the current product page.]

- Source: Bluefors LD System product page; Bluefors Application Note, The Bluefors Dilution Refrigerator as an Integrated Quantum Measurement System (2021)
- URL: https://bluefors.com/products/dilution-refrigerator-measurement-systems/ld-dilution-refrigerator-measurement-system/
- Confidence: verified-by-fetch

### Pulse tube precooling

Bluefors 'Components of the Dilution Refrigerator Measurement System': heat switches are located between the 4K Flange and the Still Flange and between the Still and Mixing Chamber stages; they are used for initial pre-cooling of the dilution refrigerator with the pulse tube from room temperature to approximately 4.2 kelvin, after which the switches' thermal contact is broken and 'the pulse tube continues to cool down just the 50K and 4K Flanges'. Bluefors 'How Does a Dilution Refrigerator Work?': incoming He-3 'enters the dilution unit precooled first by the pulse tube cryocooler down to about 3 kelvin'. [Referee: confirmed verbatim; source attribution split corrected, the heat-switch detail is on the Components page, the 3 K precool on the How-it-works page.]

- Source: Bluefors, Components of the Dilution Refrigerator Measurement System; Bluefors, How Does a Dilution Refrigerator Work?
- URL: https://bluefors.com/stories/components-of-the-dilution-refrigerator-measurement-system/
- Confidence: verified-by-fetch

### He-3/He-4 dilution cooling mechanism

Bluefors official explainer, confirmed verbatim: at temperatures below 0.87 kelvin (exact temperature depends on He-3 concentration) the He-3/He-4 mixture separates into an He-3 rich (concentrated) phase and an He-3 poor (dilute) phase; approaching absolute zero the dilute phase retains 6.6% He-3. 'The enthalpy of He-3 in the dilute phase is larger than in the concentrated phase. Hence energy is required to move He-3 atoms from the concentrated to the dilute phase', and that energy is taken from a well isolated environment so cooling occurs as He-3 is pumped through the phase boundary in the mixing chamber. The companion Components page states the system ultimately achieves about 7 millikelvin. The evaporation analogy is fair: Bluefors says the cooling is 'based on the He-3 requiring heat when pumped into the dilute phase'.

- Source: Bluefors, How Does a Dilution Refrigerator Work?
- URL: https://bluefors.com/stories/how-does-a-dilution-refrigerator-work/
- Confidence: verified-by-fetch

### CMB temperature (for the colder-than-space comparison)

Fixsen (2009), abstract confirmed verbatim: T_CMB = 2.72548 +/- 0.00057 K. Arithmetic checked: 2.72548/0.020 = 136.3 and 2.72548/0.010 = 272.5, so a mixing chamber at 10-20 mK is roughly 136x to 273x colder than the CMB, and 'over 100 times colder than deep space' is a conservative, safe published phrasing.

- Source: D. J. Fixsen, The Temperature of the Cosmic Microwave Background, Astrophys. J. 707, 916 (2009)
- URL: https://arxiv.org/abs/0911.1955
- Confidence: verified-by-fetch

### Qubit operating temperature in the canonical review

Krantz et al., confirmed verbatim: 'Typical qubits are designed at frequency wq/2pi ~ 5 GHz and are operated at dilution refrigerator temperatures T ~ 20 mK.' The stated rationale, also verbatim: in this limit 'the up-rate Gamma_1-up is exponentially suppressed by the Boltzmann factor exp(-hbar wq / kB T)', so the environment rarely introduces a qubit excitation and equilibrium polarization approaches unity.

- Source: Krantz et al., A Quantum Engineer's Guide to Superconducting Qubits, Applied Physics Reviews 6, 021318 (2019)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Drive line attenuation, distributed across stages

Krinner et al., confirmed: a total attenuation of at least about 60 dB is required to reach a noise photon number of about 1e-3 at the MXC (the 60 dB lower bound comes from nBE(300 K, nu0)/1e-3); their reference configuration is 'attenuation of 60 dB that is composed of 20 dB attenuators on the 4K, CP, and MXC stages', and their selected compromise configuration C3 yields a noise photon number of about 0.1% including cable attenuation. Bluefors application note, confirmed: '61 dB of distributed added attenuation' along the input line, with coaxial line insertion loss of approximately 10 dB at 10 GHz.

- Source: Krinner et al. 2019, Sections 2.2.1 and 3.2; Bluefors Application Note 2021
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Flux line configuration

Krinner et al., confirmed verbatim: 'Low-pass filters in the flux lines limit the bandwidth to about 1 GHz' and a suitable amount of attenuation (10-20 dB) is added in the flux lines; computed T2* = (46, 426, 2333) us for (0, 10, 20) dB leads to the conclusion 'an attenuation of 10-20 dB at the 4K stage is sufficient to mitigate qubit dephasing due to thermal noise'.

- Source: Krinner et al. 2019, Sections 3.1 and 3.3
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Readout output chain: superconducting NbTi coax, amplifiers, circulators and isolators

Krinner et al., confirmed verbatim: 'To minimize signal loss between the two amplifiers, we use superconducting NbTi coaxial cables between MXC and 4K'; a travelling wave Josephson parametric amplifier (TWPA) with broadband gain of 20-30 dB over 3-12 GHz sits at MXC; HEMT amplifiers (LNF LNC4_8C) with gain of about 40 dB at the 4K stage; 'More than a total of 60 dB isolation towards the sample is provided by a circulator (Quinstar QCY-060400CM00) at CP and two isolators at MXC'; 'Circulators and isolators are both magnetically shielded'. Bluefors application note, confirmed: 0.86 mm NbTi-NbTi coax between MXC and 4K flanges, and 'triple-stage isolators protect the qubit from High-Electron Mobility Transistor (HEMT) amplifier backaction'.

- Source: Krinner et al. 2019, Section 3.4; Bluefors Application Note 2021
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Infrared filtering at the mixing chamber

Krinner et al., confirmed: 'To filter infrared radiation that can lead to quasi-particle generation and thus to a reduced T1 time, we provide the option to install a custom-built IR filter based on Eccosorb CR-124 absorber material right before the attenuator at MXC. With an attenuation of 6 dB at 6 GHz, it further reduces nMXC by a factor four.' Bluefors, confirmed: their IR Filter 'is comprised of a 3cm-long low-loss coaxial line that uses a microwave absorber as its dielectric', absorbing high-frequency noise far outside the measurement band that would heat the sample or randomly change the qubit state. [Referee fix: Krinner's filter is an OPTION they provide, not unconditionally installed, and the 6 dB figure is specified at 6 GHz.]

- Source: Krinner et al. 2019, Section 3.2 and Appendix C; Bluefors Application Note 2021
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Magnetic shielding: high-permeability outer shell plus superconducting inner shield

Bluefors application note, confirmed verbatim: 'The 3D cavity is mounted within a dual-layer magnetic shield that includes a high-permeability material as its outer layer and an inner aluminum superconducting shield that expels ambient fields due to the Meissner effect'; the inner shield has 'a rough, optically black coating that is also designed to absorb infrared (IR) radiation'. Kreikebaum et al., confirmed verbatim: 'Magnetic shields consisted of Cryoperm 10 and Sn plating of the Cu cans'; radiation shielding was '100 mK and 500 mK Cu cans coated with infrared absorbing epoxy'; Al resonators showed the largest quality-factor gains 'from the addition of the first radiation and magnetic shields', while TiN samples showed no significant variation with limited shielding. [Referee fixes: the app note's shielded object is a 3D cavity in their example, not a generic planar sample; Kreikebaum's measurements were performed in an adiabatic demagnetization refrigerator with ~200 uT stray fields at the unshielded stage, not a dilution refrigerator.]

- Source: Bluefors Application Note 2021; Kreikebaum et al., Optimization of infrared and magnetic shielding of superconducting TiN and Al coplanar microwave resonators, Supercond. Sci. Technol. 29, 104002 (2016)
- URL: https://arxiv.org/abs/1608.06273
- Confidence: verified-by-fetch

### Control lines per qubit (render the cable count from this)

Krinner et al., confirmed verbatim: a 50-qubit processor 'with individual drive and flux control and with a multiplexed readout architecture allowing for simultaneous readout of sets of 6-7 qubits... requires a total of 124 RF lines (50 drive lines, 50 flux lines, 8 output lines, 8 read-in lines, 8 TWPA pump lines)'. Also confirmed: 'each readout line allows for the simultaneous readout of up to 10 superconducting qubits', and the photographed fridge (Fig. 3) carries 25 drive lines, 25 flux lines, 4 read-out, 6 read-in, and 5 pump lines. The paper adds that thermal performance would allow a 150-qubit processor if coaxial line capacity were tripled.

- Source: Krinner et al. 2019, Sections 3.1, 3.4, 6 and Fig. 3
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Plate and shield materials: gold-plated copper

Bluefors application note, confirmed verbatim: the RF installation set (KF40) includes '1x aluminum, 4x gold plated copper thermal anchoring flanges for the 50K, 4K, still, Cold plate and mixing chamber stages respectively', and 'The LD250 is equipped with a cylindrical gold-plated copper radiation shield that is attached at the still flange and surrounds the sample space'. Krinner et al., confirmed verbatim: 'The heat shields are made of Aluminium on the 50K and 4K stage and of Cu on Still and MXC', each temperature stage except CP fitted with a dedicated heat shield, emissivity 0.06 as quoted by the manufacturer.

- Source: Bluefors Application Note 2021; Krinner et al. 2019, Section 2.3
- URL: https://bluefors.com/wp-content/uploads/2023/09/Application-Note-Bluefors-Dilution-Refrigerator-as-an-Integrated-Quantum-Measurement-System.pdf
- Confidence: verified-by-fetch

### Why gold plating (thermal contact and oxidation)

Dhuley (Fermilab, Cryogenics 2019), confirmed verbatim: 'Due to its low oxygen affinity, gold plating of copper is an effective approach of preventing surface oxides and achieving electronic thermal conductance across pressed contacts.' And: 'Another advantage of gold is its lower surface hardness than copper. Consequently, gold plated contacts have larger area of physical contact... and therefore lower thermal resistance for a given applied force.' The review also states gold plating can lower contact resistance by as much as an order of magnitude around 4.2 K and below versus bare copper-copper contacts.

- Source: R. C. Dhuley, Pressed copper and gold-plated copper contacts at low temperatures: A review of thermal contact resistance, Cryogenics 101, 111-124 (2019), DOI 10.1016/j.cryogenics.2019.06.008 (FERMILAB-PUB-19-134-TD)
- URL: https://www.osti.gov/pages/servlets/purl/1542958
- Confidence: verified-by-fetch

### What the chandelier is

The famous golden 'chandelier' is the dilution refrigerator's internal plate-and-cable assembly seen with its vacuum can and radiation shields removed. Bluefors, confirmed verbatim: 'there is a vacuum can covering the system' sealed at the room temperature flange, and 'each of the different temperature stages are covered by a radiation shield'. IBM Quantum blog, now fetched directly and confirmed verbatim: 'The golden "chandelier" is a multi-tiered dilution refrigerator that cools a quantum processor held on the bottom tier.' [Referee fix: the earlier IBM paraphrase about gold-plated copper plates dividing thermal zones near 10 mK and the MXC hosting amplifiers, filters, and mounts is NOT on the fetched IBM page and was cut; those physical facts are independently supported by the Bluefors and Krinner claims above, so cite them there, not to IBM.]

- Source: Bluefors, Components of the Dilution Refrigerator Measurement System; IBM Quantum blog, IBM's new modular architecture for cryogenic systems
- URL: https://www.ibm.com/quantum/blog/modular-cryogenics
- Confidence: verified-by-fetch

### Input cable materials

Bluefors application note, confirmed verbatim: input lines are silver-plated cupronickel (SCuNi) coax with 0.86 mm outer diameter with distributed attenuation; between 4K and the Room Temperature Flange the readout return path uses 2.19 mm SCuNi-CuNi cable. Krinner et al., confirmed: drive lines use stainless steel coax (UT85-SS-SS) chosen for low passive heat load, output lines use superconducting NbTi (UT85-NbTi) between MXC and 4K with stainless steel from 4K to room temperature, and pre-installed DC looms are Cu (AWG35) or PhBr (AWG36) twisted pairs from room temperature to 4K and NbTi twisted pairs from 4K to MXC. [Referee fix: original wording implied all 4K-to-MXC cabling is NbTi; in Krinner NbTi below 4K applies to the output lines and DC looms, while drive lines are stainless steel throughout.]

- Source: Bluefors Application Note 2021; Krinner et al. 2019, Sections 2.1, 3.1, 3.4 and Fig. 1
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Uncertain / do not assert

- IBM-specific engineering detail (gold-plated copper plates dividing the cryostat into thermal zones near 10 mK, with the mixing chamber stage hosting amplifiers, filters, cabling, and processor mounts): not present on the fetched IBM modular-cryogenics page, so it cannot be attributed to IBM; the physics is separately supported by Bluefors and Krinner sources, but do not print it with an IBM citation.

- The 14 mK MXC figure for 50-qubit operation is a prediction computed by Krinner et al. from measured per-line passive and active loads, not a logged temperature of a running 50-qubit processor; phrase it as 'predicted operating temperature' if precision matters.

- The Bluefors application note (2021) describes an LD250 system; the current LD product line lists only LD350 and LD450 (LD250/LD400 naming is retired), so pair model names with the document vintage when quoting.

- Verification method note: the WebFetch tool was rate-limited for this entire session; all confirmations above were made by directly downloading the primary documents (arXiv PDFs, Bluefors pages and application note PDF, OSTI PDF, IBM blog HTML) via curl and reading the extracted text, which is a direct fetch of the primary source.


## foundations

### Qubit state and normalization

A qubit state is |psi> = alpha|0> + beta|1> (Eq. 1.1), where alpha and beta are complex numbers. Verified verbatim against the book text: 'It is also possible to form linear combinations of states, often called superpositions: |psi> = alpha|0> + beta|1>' and 'Naturally, |alpha|^2 + |beta|^2 = 1, since the probabilities must sum to one... Thus, in general a qubit's state is a unit vector in a two-dimensional complex vector space.' All on printed p. 13 of the 10th Anniversary Edition (referee re-derived the printed page number from the page header 'Quantum bits 13' in the fetched PDF). Claim survives unchanged.

- Source: Nielsen & Chuang, Quantum Computation and Quantum Information, 10th Anniversary Edition, Cambridge University Press, 2010, Sec. 1.2, p. 13; full text downloaded and text-extracted by the referee
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### Bloch sphere parametrization (N&C)

Verified verbatim: because the state is normalized, |psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1> (Eq. 1.4, printed p. 15), after dropping the global phase factor, which the book says 'has no observable effects'. Exact text: 'The numbers theta and phi define a point on the unit three-dimensional sphere, as shown in Figure 1.3. This sphere is often called the Bloch sphere.' The multi-qubit warning 'there is no simple generalization of the Bloch sphere' also confirmed on p. 15. Claim survives unchanged.

- Source: Nielsen & Chuang, 10th Anniversary Edition, Sec. 1.2, p. 15, Eq. (1.4) and Figure 1.3; verified against extracted book text
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### Bloch sphere physical meaning of poles, equator, phase (Krantz)

Verified verbatim against arXiv v5 (rendered full text): 'If we visualize the Bloch sphere as the planet Earth, then by convention, the north pole represents state |0> and the south pole state |1>' (Fig. 4(a) discussion), and 'a qubit with polarization p = 1 is entirely in the ground state (|0>) at the north pole, p = -1 is entirely in the excited state (|1>) at the south pole, and p = 0 is a completely depolarized mixed state at the center of the Bloch sphere.' The equal superposition (1/sqrt(2))(|0> + |1>) is described as 'pointed along the x-axis on the equator', and pure dephasing is described as 'depolarizing the azimuthal phase with a rate Gamma_phi' (Fig. 4 caption). Tightened: quote wording corrected from 'depolarizes' to the paper's 'depolarizing the azimuthal phase', and the Earth-convention sentence added.

- Source: Krantz, Kjaergaard, Yan, Orlando, Gustavsson, Oliver, 'A Quantum Engineer's Guide to Superconducting Qubits', arXiv:1904.06560 (v5, 7 Jul 2021), Fig. 4 and Sec. on longitudinal/transverse relaxation; full text fetched via ar5iv render
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Measurement, Born rule, collapse

Verified verbatim: 'When we measure a qubit we get either the result 0, with probability |alpha|^2, or the result 1, with probability |beta|^2' (p. 13). Postulate 3 confirmed: 'Quantum measurements are described by a collection {M_m} of measurement operators' (statement begins on printed p. 84); the probability formula p(m) = <psi|M_m^dagger M_m|psi> is Eq. (2.92) and the post-measurement state M_m|psi>/sqrt(p(m)) is Eq. (2.93), both on printed p. 85. Tightened: added the specific equation numbers (2.92) and (2.93); the page span pp. 84-85 is confirmed by the page headers in the fetched text.

- Source: Nielsen & Chuang, 10th Anniversary Edition, p. 13 and Sec. 2.2.3 Postulate 3, pp. 84-85, Eqs. (2.92)-(2.93); verified against extracted book text
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### 2^n amplitudes framing done correctly (N&C)

Verified verbatim on printed p. 17: 'a quantum state of such a system is specified by 2^n amplitudes. For n = 500 this number is larger than the estimated number of atoms in the Universe! Trying to store all these complex numbers would not be possible on any conceivable classical computer.' Paired restriction verified on p. 13: 'we cannot examine a qubit to determine its quantum state, that is, the values of alpha and beta' and 'we can only acquire much more restricted information about the quantum state.' Framing is correct: amplitudes are description, not readable parallel output. No parallelism fallacy present. Claim survives unchanged.

- Source: Nielsen & Chuang, 10th Anniversary Edition, Sec. 1.2.1, p. 17 and Sec. 1.2, p. 13; verified against extracted book text
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### Canonical Aaronson statement against 'tries all answers at once'

Verified by direct fetch of the live site HTML on 2026-08-29. The banner reads verbatim: 'If you take nothing else from this blog: quantum computers won't solve hard problems instantly by just trying all solutions in parallel.' Tightened with provenance caveat: an earlier long-running version of the tagline read 'Quantum computers would not solve hard search problems instantaneously by simply trying all the possible solutions at once' (widely quoted, e.g. in a 2018 Hacker News thread), so the wording is version-dependent; if quoted, date the banner. Note this is the author's own site used for attribution of the correction, not a peer-reviewed source.

- Source: Scott Aaronson, Shtetl-Optimized site banner, fetched 2026-08-29 (author's own site)
- URL: https://scottaaronson.blog/
- Confidence: verified-by-fetch

### Preskill on why naive quantum parallelism fails

Verified verbatim from the fetched PDF, Sec. 1.5 'Quantum parallelism' (passage on printed p. 13 of the chapter, just before Sec. 1.6): 'If, for example, I were to measure the input register, I would obtain a result |x0>, where x0 is chosen completely at random from the 2^N possible values... because Eq. (1.14) has been destroyed by the measurement, the intricate correlations among the registers have been lost, and we get no opportunity to determine f(y0) for any y0 != x0 by making further measurements. In this case, then, the quantum computation provided no advantage over a classical one.' Tightened: the 'more clever' sentence verbatim is 'The lesson of the solution to Deutsch's problem is that we can sometimes be more clever in exploiting the correlations encoded in Eq. (1.14).' Note for quoters: the same section uses the phrase 'massive parallelism' approvingly two paragraphs earlier, then immediately supplies this correction; quote the correction with its context.

- Source: John Preskill, Lecture Notes for Physics 229: Quantum Information and Computation, Caltech, Chapter 1, Sec. 1.5 Quantum parallelism; PDF downloaded and text-extracted
- URL: https://www.preskill.caltech.edu/ph229/notes/chap1.pdf
- Confidence: verified-by-fetch

### Bell state, correlations, non-factorization

Verified verbatim: Eq. (1.7) gives (|00> + |11>)/sqrt(2) on printed p. 16, which the book calls 'the Bell state or EPR pair'; 'a measurement of the second qubit always gives the same result as the measurement of the first qubit. That is, the measurement outcomes are correlated' (p. 17); 'stronger than could ever exist between classical systems' (p. 17). Non-factorization verified: Eq. (2.132) on printed p. 95 with 'there are no single qubit states |a> and |b> such that |psi> = |a>|b>', and the entangled-state definition ('can't be written as a product of states of its component systems') on p. 96. Claim survives; tightened only by adding the book's own label 'the Bell state or EPR pair'.

- Source: Nielsen & Chuang, 10th Anniversary Edition, Eq. (1.7) p. 16, p. 17, and Sec. 2.2.8 Eq. (2.132) pp. 95-96; verified against extracted book text
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### Entanglement does not allow faster-than-light signalling

Verified verbatim on printed p. 28: 'quantum teleportation does not enable faster than light communication, because to complete the teleportation Alice must transmit her measurement result to Bob over a classical communications channel. We will show in Section 2.4.3 that without this classical communication, teleportation does not convey any information at all. The classical channel is limited by the speed of light...' The sentence 'physical influences cannot propagate faster than light' verified as appearing in the Bell inequality discussion (Sec. 2.6, text accompanying Figure 2.4). The rigorous no-signalling argument via the reduced density operator is on printed p. 108 (Sec. 2.4.3). Tightened: located the 'physical influences' sentence precisely in Sec. 2.6 rather than 'Sec. 2.6 area'.

- Source: Nielsen & Chuang, 10th Anniversary Edition, Sec. 1.3.7 p. 28, Sec. 2.4.3 p. 108, and Sec. 2.6 (Fig. 2.4 discussion); verified against extracted book text
- URL: https://asignaturas.df.uba.ar/tdmc-pazroncagliaschmiegelowwisniacki/wp-content/uploads/sites/50/2025/03/Quantum-Computation-and-Quantum-Information-MICHAEL-NIELSEN-ISAAC-CHUANG.pdf
- Confidence: verified-by-fetch

### Bell 1964 original citation

J. S. Bell, 'On the Einstein Podolsky Rosen paradox', Physics Physique Fizika 1, 195-200 (1964), DOI 10.1103/PhysicsPhysiqueFizika.1.195. Verified by direct fetch of the Crossref DOI registry record: title, sole author J. S. Bell, container 'Physics Physique Fizika', volume 1, pages 195-200, published 1964-11-01. Confidence upgraded from verified-by-search to verified-by-fetch (Crossref API record for the APS-registered DOI; the APS landing page itself returns 403 to non-browser fetches).

- Source: Crossref DOI registry record for 10.1103/PhysicsPhysiqueFizika.1.195 (APS, Physics Physique Fizika 1, 195-200, 1964)
- URL: https://link.aps.org/doi/10.1103/PhysicsPhysiqueFizika.1.195
- Confidence: verified-by-fetch

### No-cloning theorem original paper

W. K. Wootters and W. H. Zurek, 'A single quantum cannot be cloned', Nature 299, 802-803 (1982), DOI 10.1038/299802a0. Citation verified via both the Crossref DOI record and the Nature article page. Exact closing sentence of the abstract, verified from the Nature page metadata: 'We show here that the linearity of quantum mechanics forbids such replication and that this conclusion holds for all quantum systems.' Tightened: restored the full sentence including 'We show here that'. An unknown quantum state cannot be copied.

- Source: Wootters & Zurek, Nature 299, 802-803 (1982); Nature article page and Crossref record fetched
- URL: https://www.nature.com/articles/299802a0
- Confidence: verified-by-fetch

### T1 energy relaxation definition

Verified against arXiv v5 full text: Gamma_1 = 1/T1 is Eq. (41) and Gamma_1 = 1/T1 = Gamma_1down + Gamma_1up is Eq. (45), exactly as claimed. Verbatim: Gamma_1 'describes depolarization along the qubit quantization axis, often referred to as "energy decay" or "energy relaxation"' and 'T1 is the 1/e decay time in the exponential decay function in Eq. (44), and it is the characteristic time scale over which qubit population will relax to its steady-state value. For superconducting qubits, this steady-state value is generally the ground state, due to Boltzmann statistics and typical operating conditions.' The numeric parenthetical is also directly in the paper: 'Typical qubits are designed at frequency omega_q/2pi ~ 5 GHz and are operated at dilution refrigerator temperatures T ~ 20 mK. In this limit, the up-rate Gamma_1up is exponentially suppressed by the Boltzmann factor exp(-hbar omega_q / k_B T).' Claim survives unchanged; equation numbers apply to arXiv v5.

- Source: Krantz et al., 'A Quantum Engineer's Guide to Superconducting Qubits', arXiv:1904.06560 v5, Eqs. (41), (44), (45); full text fetched via ar5iv render
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### T2 dephasing definition and T2 <= 2T1

Verified against arXiv v5 full text: Gamma_2 = 1/T2 = Gamma_1/2 + Gamma_phi is Eq. (42), exactly as claimed. Verbatim: Gamma_2 'describes the loss of coherence of a superposition state, for example (1/sqrt(2))(|0> + |1>), pointed along the x-axis on the equator of the Bloch sphere', and 'the energy decay component of the transverse relaxation is exp(-t/2T1), and so T2 can never be larger than 2T1. In the absence of pure dephasing, the maximum T2 = 2T1 is reached.' The caveat is verbatim in the paper: 'the definition of Gamma_2 as a sum of rates presumes that the individual decay functions are exponential, which occurs for Lorentzian noise spectra (centered at omega = 0) such as white noise (short correlation times) with a high-frequency cutoff'; for 1/f flux noise the dephasing envelope is Gaussian, exp(-t^2/T_phi,G^2). Claim survives; caveat wording tightened to the exact text.

- Source: Krantz et al., 'A Quantum Engineer's Guide to Superconducting Qubits', arXiv:1904.06560 v5, Eq. (42) and Transverse relaxation section; full text fetched via ar5iv render
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Krantz et al. paper identity

Verified by direct fetch of the arXiv abstract page: title 'A Quantum Engineer's Guide to Superconducting Qubits'; authors Philip Krantz, Morten Kjaergaard, Fei Yan, Terry P. Orlando, Simon Gustavsson, William D. Oliver; submitted 13 Apr 2019 (v1), last revised 7 Jul 2021 (v5); journal reference Applied Physics Reviews 6, 021318 (2019). Tightened: added the v5 revision date and the precise journal reference including article number 021318.

- Source: arXiv abstract page, arXiv:1904.06560, fetched 2026-08-29
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Uncertain / do not assert

- The Nielsen & Chuang full text was verified against a PDF hosted on a Universidad de Buenos Aires physics course page, not a Cambridge University Press copy. The extracted page headers match the 10th Anniversary Edition printed pagination (e.g. 'Quantum bits 13', 'The postulates of quantum mechanics 85'), so page and equation citations are trustworthy, but the hosting is a course mirror of unknown licensing status; cite the book, not the URL, in any publication.

- Krantz et al. equation numbers (41), (42), (44), (45) were verified against arXiv v5 (7 Jul 2021). The published Applied Physics Reviews 6, 021318 (2019) version was not checked and may number equations differently; if citing the APR version, re-verify equation numbers there.

- The Aaronson banner wording is version-dependent: the currently live text matches the claim verbatim (fetched 2026-08-29), but an older widely quoted variant reads 'Quantum computers would not solve hard search problems instantaneously by simply trying all the possible solutions at once.' Any quotation should be dated. It is also a blog banner, acceptable only as attribution of the myth-correction to its author, not as a physics anchor.

- The Preskill passage's printed page number within chap1.pdf (p. 13 of the chapter) reflects the current PDF on preskill.caltech.edu; Preskill has revised these notes over the years, so pin the download date if page-level citation matters.

- The APS landing page for Bell 1964 could not be fetched directly (403 to non-browser clients); bibliographic data was verified through the Crossref registry record for the APS-registered DOI instead.


## platforms

### Trapped-ion gate proposal (Cirac-Zoller)

Cirac and Zoller proposed in 1995 that a quantum computer can be built from cold ions confined in a linear (Paul) trap, with quantum gates between any pair of ions mediated by the collective quantized motion of the chain. Published as Phys. Rev. Lett. 74, 4091-4094 (15 May 1995).

- Source: Cirac & Zoller, Quantum Computations with Cold Trapped Ions, Phys. Rev. Lett. 74, 4091 (1995)
- URL: https://link.aps.org/doi/10.1103/PhysRevLett.74.4091
- Confidence: verified-by-search

### Molmer-Sorensen gate

Molmer and Sorensen proposed in 1999 an entangling gate that exploits the ions' collective vibrational motion but works even when that motion is not fully controlled (ions may be in thermal motion), the basis of the two-qubit gates used in today's commercial ion machines. Published as Phys. Rev. Lett. 82, 1835 (1999); the companion paper is Sorensen & Molmer, Phys. Rev. Lett. 82, 1971 (1999).

- Source: Molmer & Sorensen, Multiparticle Entanglement of Hot Trapped Ions, Phys. Rev. Lett. 82, 1835 (1999)
- URL: https://link.aps.org/doi/10.1103/PhysRevLett.82.1835
- Confidence: verified-by-search

### Ion species in use

Yb-171 is the qubit ion in IonQ's production systems and Quantinuum's H1/H2. Quantinuum's Helios (unveiled November 2025, 98 qubits) uses Ba-137 qubit ions with co-trapped Yb-171 coolant ions: the Yb-171 is laser-cooled and sympathetically cools the Ba-137 via Coulomb coupling. Ca-40 optical qubits are used by the Innsbruck/AQT rack-mounted demonstrator (Pogorelov et al., PRX Quantum 2, 020343 (2021), GHZ states of up to 24 ions without postselection or error mitigation).

- Source: Pogorelov et al., PRX Quantum 2, 020343 (2021); Quantinuum, A 98-qubit trapped-ion quantum computer with all-to-all connectivity, Nature (2026), s41586-026-10676-4; Quantinuum Helios hardware user guide
- URL: https://www.nature.com/articles/s41586-026-10676-4
- Confidence: verified-by-search

### Laser cooling to the motional ground state

Resolved-sideband laser cooling of a single trapped Hg-198+ ion to the quantum ground state of its confining well (ion in the ground state about 95% of the time), via the lower motional sideband of the narrow 2S1/2-2D5/2 transition, was first demonstrated by Diedrich, Bergquist, Itano and Wineland, Phys. Rev. Lett. 62, 403-406 (January 1989); this technique is the standard preparation step before high-fidelity gates on shared motional modes.

- Source: Diedrich et al., Laser Cooling to the Zero-Point Energy of Motion, Phys. Rev. Lett. 62, 403 (1989)
- URL: https://link.aps.org/doi/10.1103/PhysRevLett.62.403
- Confidence: verified-by-search

### All-to-all connectivity in trapped-ion machines

Quantinuum's H2 is a QCCD (quantum charge-coupled device) racetrack trap in which any two qubits are physically transported into shared gate zones, so every qubit can be pairwise entangled with any other. As initially operated (2023) it had 32 fully connected qubits with average two-qubit gate infidelity 1.84(5)e-3, single-qubit infidelity 2.5(3)e-5, and SPAM error 1.6(1)e-3 (Moses et al., Phys. Rev. X 13, 041052 (2023)); H2 was upgraded to 56 qubits in June 2024.

- Source: Moses et al., A Race-Track Trapped-Ion Quantum Processor, Phys. Rev. X 13, 041052 (2023); Quantinuum 56-qubit H2 press release (June 2024)
- URL: https://link.aps.org/doi/10.1103/PhysRevX.13.041052
- Confidence: verified-by-search

### Ion gate speed vs superconducting

Trapped-ion two-qubit gates take tens to hundreds of microseconds (limited by the frequencies of the shared motional modes), roughly three orders of magnitude slower than superconducting two-qubit gates at tens to hundreds of nanoseconds; ions compensate with far longer coherence times and higher gate fidelities.

- Source: Bruzewicz, Chiaverini, McConnell & Sage, Trapped-Ion Quantum Computing: Progress and Challenges, Appl. Phys. Rev. 6, 021314 (2019), arXiv:1904.04178; Krantz et al., A Quantum Engineer's Guide to Superconducting Qubits, Appl. Phys. Rev. 6, 021318 (2019), arXiv:1904.06560
- URL: https://arxiv.org/abs/1904.04178
- Confidence: verified-by-search

### Quantinuum three-nines two-qubit fidelity

In April 2024 Quantinuum (announcing jointly with Microsoft's logical-qubit demonstration) reported the first commercial system to reach 'three nines': 99.914(3)% two-qubit gate fidelity, achieved across all qubit pairs on H1-1. Vendor announcement; the figure is consistent with the accompanying arXiv preprint of the Microsoft/Quantinuum logical-qubit work.

- Source: Quantinuum blog: Quantinuum extends its significant lead in quantum computing, achieving historic milestones for hardware fidelity and Quantum Volume (April 2024)
- URL: https://www.quantinuum.com/blog/quantinuum-extends-its-significant-lead-in-quantum-computing-achieving-historic-milestones-for-hardware-fidelity-and-quantum-volume
- Confidence: verified-by-search

### IonQ barium 99.9% and 99.99% results

IonQ announced on September 12, 2024 two-qubit gates above 99.9% fidelity in a two-ion chain on its next-generation barium development platform. In October 2025 the Oxford Ionics team (an IonQ company) reported electronically controlled two-qubit gates using a 'smooth gate' (adiabatically ramped detuning) with estimated error 8.4(7)e-5 (>99.99% fidelity) without ground-state cooling, with error remaining at or below about 5e-4 up to mean phonon occupation n-bar = 9.4(3); this surpassed Oxford Ionics' own 99.97% record from 2024. arXiv:2510.17286.

- Source: IonQ press release (Sept 12, 2024); Hughes, Srinivas, Ballance, Malinowski, Harty, Sutherland et al. (Oxford Ionics, an IonQ company), Trapped-ion two-qubit gates with >99.99% fidelity without ground-state cooling, arXiv:2510.17286 (Oct 2025)
- URL: https://arxiv.org/abs/2510.17286
- Confidence: verified-by-search

### Ion-trap ultra-high vacuum requirement

Ion traps operate at ultra-high vacuum, on the order of 1e-11 mbar (about 1e-11 Torr) or below, because collisions with background gas molecules heat the ions, decohere the qubits, can eject ions from the trap, and can chemically react to form unwanted ion species.

- Source: Bruzewicz et al., Trapped-Ion Quantum Computing: Progress and Challenges, Appl. Phys. Rev. 6, 021314 (2019), arXiv:1904.04178
- URL: https://arxiv.org/abs/1904.04178
- Confidence: verified-by-search

### Rydberg gate proposal (Jaksch 2000)

Jaksch, Cirac, Zoller, Rolston, Cote and Lukin proposed fast two-qubit gates for neutral atoms using the strong dipole-dipole interaction of atoms excited to Rydberg states, with gate times much faster than the atoms' external motion. Phys. Rev. Lett. 85, 2208 (2000).

- Source: Jaksch et al., Fast Quantum Gates for Neutral Atoms, Phys. Rev. Lett. 85, 2208 (2000)
- URL: https://link.aps.org/pdf/10.1103/PhysRevLett.85.2208
- Confidence: verified-by-search

### Rydberg dipole blockade (Lukin 2001)

Lukin et al. showed that strong dipole-dipole interactions produce a 'dipole blockade' that inhibits more than one Rydberg excitation in an ensemble, enabling collective qubit encoding and scalable quantum logic. Phys. Rev. Lett. 87, 037901 (2001).

- Source: Lukin et al., Dipole Blockade and Quantum Information Processing in Mesoscopic Atomic Ensembles, Phys. Rev. Lett. 87, 037901 (2001)
- URL: https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.87.037901
- Confidence: verified-by-search

### Tweezer-array assembly (Browaeys)

Barredo, de Leseleuc, Lienhard, Lahaye and Browaeys demonstrated an atom-by-atom assembler producing fully loaded, defect-free 2D arrays of up to ~50 single atoms in arbitrary user-defined geometries, using a moving optical tweezer with real-time control. Science 354, 1021 (2016).

- Source: Barredo et al., An atom-by-atom assembler of defect-free arbitrary two-dimensional atomic arrays, Science 354, 1021 (2016)
- URL: https://www.science.org/doi/10.1126/science.aah3778
- Confidence: verified-by-search

### 256-atom programmable simulator (Lukin group)

Ebadi et al. (Lukin group) realized a programmable quantum simulator of 64 to 256 neutral-atom qubits in 2D optical tweezer arrays with interactions controlled by Rydberg excitation, observing an Ising-type quantum phase transition. Nature 595, 227-232 (2021). QuEra's cloud machine Aquila runs up to 256 Rb-87 atoms in tweezers as an analog Hamiltonian simulator (arXiv:2306.11727).

- Source: Ebadi et al., Quantum phases of matter on a 256-atom programmable quantum simulator, Nature 595, 227 (2021); Wurtz et al., Aquila: QuEra's 256-qubit neutral-atom quantum computer, arXiv:2306.11727
- URL: https://www.nature.com/articles/s41586-021-03582-4
- Confidence: verified-by-search

### Thousands of neutral atoms demonstrated

Manetsch et al. (Caltech, Endres group) trapped over 6,100 cesium atoms in about 12,000 optical tweezer sites, with hyperfine-qubit coherence time 12.6(1) s, imaging fidelity over 99.99%, imaging survival 99.98952(1)%, and room-temperature trapping lifetimes of about 23 minutes. arXiv:2403.12021; published as Nature 647, 60 (2025), online 24 September 2025, DOI s41586-025-09641-4. Note: this paper demonstrates scale and coherence, not entangling gates.

- Source: Manetsch et al., A tweezer array with 6,100 highly coherent atomic qubits, Nature 647, 60 (2025); arXiv:2403.12021
- URL: https://www.nature.com/articles/s41586-025-09641-4
- Confidence: verified-by-fetch

### Rearrangeable geometry as a computing resource

Bluvstein et al. operated a logical quantum processor on reconfigurable neutral-atom arrays with up to 280 physical qubits, using a zoned architecture, atom transport for arbitrary connectivity, surface-code distance scaling d=3 to d=7, and sampling circuits with up to 48 logical qubits. Nature 626, 58-65 (2024).

- Source: Bluvstein et al., Logical quantum processor based on reconfigurable atom arrays, Nature 626, 58 (2024)
- URL: https://www.nature.com/articles/s41586-023-06927-3
- Confidence: verified-by-search

### Fusion-based photonic quantum computing

PsiQuantum's model of fault-tolerant photonic computing (fusion-based quantum computation, FBQC) builds universal computation from entangling 'fusion' measurements on small constant-sized entangled photonic resource states. Bartolucci et al., Nature Communications 14, 912 (2023).

- Source: Bartolucci et al., Fusion-based quantum computation, Nature Communications 14, 912 (2023)
- URL: https://www.nature.com/articles/s41467-023-36493-1
- Confidence: verified-by-search

### Photonic quantum advantage (Xanadu Borealis)

Xanadu's Borealis performed Gaussian boson sampling on 216 squeezed-light modes, detecting events with up to 219 photons (mean 125), obtaining a sample in 36 microseconds versus an estimated ~9,000 years for the best known classical algorithm on the fastest supercomputers. Madsen et al., Nature 606, 75-81 (2022). Note: this is a sampling demonstration, not a universal gate-model computation.

- Source: Madsen et al., Quantum computational advantage with a programmable photonic processor, Nature 606, 75 (2022)
- URL: https://www.nature.com/articles/s41586-022-04725-x
- Confidence: verified-by-search

### Manufacturable photonic platform (PsiQuantum)

PsiQuantum's Omega chipset, fabricated on 300-mm wafers at GlobalFoundries' high-volume commercial silicon-photonics foundry, integrates heralded single-photon sources, filters, and superconducting nanowire single-photon detectors on chip; reported 99.98% +/- 0.01% SPAM fidelity for dual-rail photonic qubits, 99.50% +/- 0.25% Hong-Ou-Mandel visibility between independent sources, 99.22% +/- 0.12% two-qubit fusion fidelity, and 99.72% +/- 0.04% chip-to-chip interconnect fidelity over 42 m of standard telecom fiber. Nature 641, 876-883 (2025).

- Source: PsiQuantum team, A manufacturable platform for photonic quantum computing, Nature 641, 876 (2025)
- URL: https://www.nature.com/articles/s41586-025-08820-7
- Confidence: verified-by-fetch

### Photonics runs warm except the detectors

Photonic qubit generation and interference circuits operate at room temperature, but the standard high-efficiency detectors (superconducting nanowire single-photon detectors, SNSPDs) are cryogenic: conventional SNSPDs run below about 4 K (common amorphous materials like WSi and MoSi in the sub-kelvin to ~2.5 K range on GM cryocoolers), with specialized devices demonstrated at 4-7 K.

- Source: Superconducting nanowire single photon detectors operating at temperature from 4 to 7 K, arXiv:1906.09969; You, Superconducting Nanowire Single-Photon Detectors for Quantum Information, Nanophotonics 9, 2673 (2020), arXiv:2006.00411
- URL: https://arxiv.org/abs/2006.00411
- Confidence: verified-by-search

### Honest platform comparison table

Comparison, each cell pinned above. SPEED: ions slowest (2q gates tens to hundreds of us, Bruzewicz 2019); neutral-atom Rydberg gates sub-microsecond in principle (Jaksch 2000) with slower system cycle times; photonic operations are intrinsically fast, but the headline figure (Borealis: full 216-mode sample in 36 us, Madsen 2022) is a boson-sampling sample time, not a gate-model gate time, so cross-platform per-operation speed is not directly comparable. FIDELITY: ions best (99.914(3)% commercial, Quantinuum 2024; >99.99% research result, arXiv:2510.17286); neutral atoms below ions (99.5% parallel CZ, Evered et al., Nature 2023, s41586-023-06481-y; best reported approximately 99.7% as of 2025-2026); photonic two-qubit fusion 99.22(12)% (Nature 641, 876). CONNECTIVITY: ions all-to-all within a chain/trap via transport (Moses 2023), neutral atoms reconfigurable arbitrary geometry via atom moves (Bluvstein 2024), photonics fixed by circuit/fusion network design (Bartolucci 2023). SCALE DEMONSTRATED: neutral atoms largest (6,100 qubits, Manetsch 2025) vs tens to about one hundred ions per trap (H2: 32 in the 2023 paper, upgraded to 56 in 2024; Helios: 98 in 2025) vs 216 photonic modes (Madsen 2022). MATURITY: ions have the most mature gate-model track record; neutral atoms lead in scale and logical-qubit demos (Bluvstein 2024); photonics has sampling-advantage demos and a foundry platform but no universal gate-model machine yet (Nature 641, 876).

- Source: Composite of the individually pinned sources listed in each cell
- URL: https://arxiv.org/abs/1904.04178
- Confidence: verified-by-search

### Uncertain / do not assert

- Citation metadata for the canonical proposal papers (Cirac-Zoller PRL 74 4091; Molmer-Sorensen PRL 82 1835; Jaksch PRL 85 2208; Lukin PRL 87 037901; Barredo Science 354 1021; Ebadi Nature 595 227; Bluvstein Nature 626 58; Bartolucci Nat Commun 14 912) matched reviewer knowledge and prior verification but was not independently re-fetched in this review pass.

- The 'roughly 1,000x slower' ion-vs-superconducting gate-speed ratio is an order-of-magnitude framing derived from the two cited reviews' typical gate times, not a single quoted figure; wording softened to 'roughly three orders of magnitude'.

- The exact ion-trap vacuum figure (1e-11 mbar) is the standard order of magnitude but the specific wording in Bruzewicz et al. was not re-fetched this pass.

- The neutral-atom two-qubit fidelity figure of 99.70(3)% without postselection comes from a DAMOP 2026 abstract listing (secondary source); the well-pinned published anchor remains 99.5% (Evered et al., Nature 2023). Exact volume/page numbers for Evered (Nature 622, 268) were not confirmed this pass, so the DOI-style link s41586-023-06481-y is given instead.

- The Quantinuum 99.914(3)% figure is anchored to a vendor blog post; it is consistent with press coverage and the associated Microsoft/Quantinuum arXiv preprint, but a peer-reviewed primary source for that exact number was not fetched.

- Whether Quantinuum's Helios uses exactly one or two Yb-171 coolant ions per Ba-137 qubit ion during mid-circuit cooling is drawn from secondary analysis of the architecture; the Nature Helios paper (s41586-026-10676-4) is the primary anchor for the species assignment itself.


## programs

### Universal gate set: 1-qubit gates + CNOT

Barenco et al. (1995) prove that the set of all one-qubit gates (U(2)) together with the two-qubit exclusive-or (CNOT) gate is universal: all unitary operations on arbitrarily many qubits (U(2^n)) can be expressed as compositions of these gates. Phys. Rev. A 52, 3457 (1995).

- Source: Barenco, Bennett, Cleve, DiVincenzo, Margolus, Shor, Sleator, Smolin, Weinfurter, Elementary gates for quantum computation, arXiv:quant-ph/9503016, Phys. Rev. A 52, 3457 (1995)
- URL: https://arxiv.org/abs/quant-ph/9503016
- Confidence: verified-by-fetch

### Canonical textbook anchor for the circuit model

Nielsen and Chuang, Quantum Computation and Quantum Information, Cambridge University Press; first published 2000, 10th Anniversary Edition 2010, ISBN 9781107002173 (ISBN-10 1107002176), 702 pages. The standard reference for gates as unitary matrices and the circuit model, and one of the most cited books in physics.

- Source: Nielsen & Chuang, Quantum Computation and Quantum Information, 10th Anniversary Edition, Cambridge University Press (2010)
- URL: https://isbnsearch.org/isbn/9781107002173
- Confidence: verified-by-search

### Correct parallelism framing (anti cardinal-sin)

n qubits are described by amplitudes over 2^n basis states; algorithms choreograph interference so wrong computational paths cancel and right paths reinforce, and measurement returns one outcome. A quantum computer does not evaluate 2^n answers in parallel and read them all out. Grover's own 1996 abstract describes the mechanism as quantum superposition with phase interference reinforcing correct solutions; Preskill (arXiv:1801.00862) and Nielsen & Chuang are consistent with this framing, and none of the anchor sources fetched commit the tries-all-answers-at-once error.

- Source: Grover, arXiv:quant-ph/9605043; Preskill, arXiv:1801.00862; Nielsen & Chuang (2010)
- URL: https://arxiv.org/abs/1801.00862
- Confidence: verified-by-fetch

### Qiskit transpiler: stages, native-gate translation, SWAP insertion

IBM's Qiskit transpiler runs six stages: init, layout, routing, translation, optimization, scheduling. Layout maps virtual qubits to the QPU's physical qubits; the routing pass injects SWAP gates to make the circuit compatible with the QPU's connectivity (coupling map); translation rewrites gates into the backend's basis instruction set as specified in its Target object.

- Source: IBM Quantum documentation, Introduction to transpilation
- URL: https://quantum.cloud.ibm.com/docs/en/guides/transpile
- Confidence: verified-by-fetch

### IBM heavy-hex topology (date-scoped; no longer IBM's end state)

IBM's heavy-hex lattice places qubits in a hexagonal unit cell plus one qubit on each edge; it deliberately reduces connectivity (each qubit couples to 2 or 3 neighbors) to minimize frequency collisions and spectator/crosstalk errors. From August 8, 2021 all active IBM Quantum devices used the heavy-hex lattice, retiring the earlier square and bow-tie topologies. However, this is no longer current: IBM's Nighthawk processor (announced November 2025, 120 qubits) returns to a square lattice with 4-nearest-neighbor connectivity for roughly 16x the effective circuit depth of Heron. Any present-tense 'all IBM devices are heavy-hex' statement is outdated.

- Source: IBM Quantum blog, The IBM Quantum heavy hex lattice; IBM Nighthawk announcement coverage
- URL: https://www.ibm.com/quantum/blog/heavy-hex-lattice
- Confidence: verified-by-search

### OpenQASM 3 exists and covers timing and pulse-level control

Cross et al., OpenQASM 3: A broader and deeper quantum assembly language (arXiv:2104.14722, submitted 30 April 2021), adds arbitrary classical control flow, calls to external classical functions, timing, pulse control, and gate modifiers, forming a multi-level intermediate representation for circuit development and optimization as well as control sequence implementation for calibration, characterization, and error mitigation.

- Source: Cross et al., OpenQASM 3, arXiv:2104.14722
- URL: https://arxiv.org/abs/2104.14722
- Confidence: verified-by-fetch

### Pulse-level cloud programming (Qiskit Pulse), now retired on IBM hardware

Alexander et al., Qiskit Pulse: Programming Quantum Computers Through the Cloud with Pulses (arXiv:2004.06755, submitted 14 April 2020), implemented a pulse-level programming paradigm in Qiskit-Terra and demonstrated it by calibrating cross-resonance sequences into a CNOT gate with average gate fidelities of F = 0.981 (un-echoed) and F = 0.979 (echoed) on a cloud-accessible IBM system. Important present-day caveat: IBM removed backend support for Qiskit Pulse instructions on its quantum systems on 3 February 2025 in favor of built-in fractional gates, and the qiskit.pulse module was removed in Qiskit SDK 2.0. Qiskit Pulse is a historical capability, not a current IBM cloud feature.

- Source: Alexander et al., Qiskit Pulse, arXiv:2004.06755; IBM Quantum documentation, Migrate from Qiskit Pulse to fractional gates
- URL: https://arxiv.org/abs/2004.06755
- Confidence: verified-by-fetch

### Nanosecond gates, microwave pulses, FPGA-based sequencers

Superconducting qubit gates are shaped microwave pulses generated by FPGA-based arbitrary waveform generators; the canonical control-stack reference is Krantz et al., A Quantum Engineer's Guide to Superconducting Qubits, Applied Physics Reviews 6, 021318 (2019), arXiv:1904.06560, which covers qubit control and readout. Pinned published figures: Sheldon et al. (arXiv:1603.04821, Phys. Rev. A 93, 060302(R) (2016)) report a 160 ns echoed cross-resonance gate at 99.1 percent fidelity using a 20 ns DRAG pi-pulse; single-qubit gates are typically tens of nanoseconds and two-qubit gates tens to hundreds of nanoseconds depending on architecture and era.

- Source: Krantz et al., arXiv:1904.06560, Appl. Phys. Rev. 6, 021318 (2019); Sheldon et al., arXiv:1603.04821, PRA 93, 060302(R) (2016)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-search

### Shor's algorithm: factoring in polynomial time

Shor's algorithm factors integers and computes discrete logarithms in a number of steps polynomial in input size on a quantum computer; the speedup over the best known classical algorithm is superpolynomial, not proven exponential, because there is no proof that factoring is classically hard. Algorithm presented at FOCS 1994; full paper arXiv:quant-ph/9508027, journal version SIAM J. Comput. 26, 1484 (1997).

- Source: Shor, Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer, arXiv:quant-ph/9508027, SIAM J. Comput. 26, 1484 (1997)
- URL: https://arxiv.org/abs/quant-ph/9508027
- Confidence: verified-by-fetch

### Grover's algorithm: quadratic search speedup

Grover (submitted 29 May 1996) shows an unstructured search over N items succeeds in O(sqrt(N)) quantum steps, versus a classical minimum of N/2 lookups for 50 percent success probability. The speedup is quadratic, not exponential.

- Source: Grover, A fast quantum mechanical algorithm for database search, arXiv:quant-ph/9605043
- URL: https://arxiv.org/abs/quant-ph/9605043
- Confidence: verified-by-fetch

### Grover speedup is provably optimal

Bennett, Bernstein, Brassard, Vazirani (SIAM J. Comput. 26(5):1510-1523, 1997; arXiv:quant-ph/9701001) prove that relative to a random oracle, NP cannot be solved on a quantum Turing machine in time o(2^(n/2)); combined with Grover's O(2^(n/2)) upper bound, the square-root speedup is tight. There is no exponential quantum speedup for brute-force search.

- Source: Bennett, Bernstein, Brassard, Vazirani, Strengths and Weaknesses of Quantum Computing, arXiv:quant-ph/9701001, SIAM J. Comput. 26(5):1510-1523 (1997)
- URL: https://arxiv.org/abs/quant-ph/9701001
- Confidence: verified-by-fetch

### Quantum simulation: Feynman 1982 proposal

Feynman proposed using quantum computers to simulate quantum physics in Simulating Physics with Computers, International Journal of Theoretical Physics 21, 467-488 (1982), DOI 10.1007/BF02650179.

- Source: Feynman, Simulating Physics with Computers, Int. J. Theor. Phys. 21, 467-488 (1982)
- URL: https://link.springer.com/article/10.1007/BF02650179
- Confidence: verified-by-search

### Quantum simulation: Lloyd 1996 proof

Lloyd, Universal Quantum Simulators, Science 273(5278), 1073-1078 (23 August 1996), proves Feynman's 1982 conjecture correct: a quantum computer can be programmed to efficiently simulate any local quantum system.

- Source: Lloyd, Universal Quantum Simulators, Science 273, 1073-1078 (1996)
- URL: https://www.science.org/doi/10.1126/science.273.5278.1073
- Confidence: verified-by-search

### HHL linear-systems algorithm and its caveats

Harrow, Hassidim, Lloyd (Phys. Rev. Lett. 103, 150502 (2009); arXiv:0811.3171) give a quantum algorithm running in poly(log N, kappa) time versus classical O(N sqrt(kappa)) for sparse N x N systems with condition number kappa, an exponential improvement over the best classical algorithm, but only when one needs an approximation of the expectation value of some operator associated with the solution x, not the full solution vector itself; sparsity and bounded condition number are required.

- Source: Harrow, Hassidim, Lloyd, Quantum algorithm for solving linear systems of equations, arXiv:0811.3171, PRL 103, 150502 (2009)
- URL: https://arxiv.org/abs/0811.3171
- Confidence: verified-by-fetch

### Preskill NISQ framing

Preskill, Quantum Computing in the NISQ era and beyond (arXiv:1801.00862, submitted 2 January 2018; Quantum 2, 79 (2018)): NISQ = Noisy Intermediate-Scale Quantum; quantum computers with 50-100 qubits may surpass classical capabilities on some tasks, but noise in quantum gates will limit the size of circuits that can be executed reliably; the 100-qubit quantum computer will not change the world right away, and near-term devices are mainly tools for exploring many-body quantum physics on the road to fault tolerance.

- Source: Preskill, arXiv:1801.00862, Quantum 2, 79 (2018)
- URL: https://arxiv.org/abs/1801.00862
- Confidence: verified-by-fetch

### VQE first demonstration (Peruzzo 2014)

Peruzzo et al., A variational eigenvalue solver on a quantum processor, Nature Communications 5:4213 (2014; arXiv:1304.3061): a hybrid variational algorithm on a small-scale photonic quantum processor combined with a conventional computer calculated the ground-state molecular energy of He-H+ to within chemical accuracy, drastically reducing coherence-time requirements versus the quantum phase estimation algorithm.

- Source: Peruzzo et al., Nat. Commun. 5:4213 (2014), arXiv:1304.3061
- URL: https://arxiv.org/abs/1304.3061
- Confidence: verified-by-fetch

### Google 2019 sampling-supremacy result

Arute et al., Quantum supremacy using a programmable superconducting processor, Nature 574, 505-510 (2019): the 54-qubit Sycamore processor (53 working qubits) performed random circuit sampling, collecting one million samples in about 200 seconds, with the paper estimating roughly 10,000 years for an equivalent task on a state-of-the-art classical supercomputer. The task was sampling, not a useful computation, and the classical estimate was disputed almost immediately (IBM argued days, and later work reduced it further; see the Pan et al. claim).

- Source: Arute et al., Nature 574, 505-510 (2019)
- URL: https://www.nature.com/articles/s41586-019-1666-5
- Confidence: verified-by-search

### Classical spoofing of the Sycamore sampling claim

Pan, Chen, Zhang, Solving the sampling problem of the Sycamore quantum circuits, Phys. Rev. Lett. 129, 090502 (2022; arXiv:2111.03011): tensor-network contraction generated one million uncorrelated bitstrings from the 53-qubit 20-cycle Sycamore circuit at fidelity F ~ 0.0037 in about 15 hours on 512 GPUs, and the authors estimate a few dozen seconds if implemented efficiently on an ExaFLOPS supercomputer, faster than Google's quantum hardware. The 10,000-year estimate did not hold.

- Source: Pan, Chen, Zhang, PRL 129, 090502 (2022), arXiv:2111.03011
- URL: https://arxiv.org/abs/2111.03011
- Confidence: verified-by-fetch

### IBM utility-era result (2023), later matched classically

Kim et al., Evidence for the utility of quantum computing before fault tolerance, Nature 618, 500-505 (2023): a noisy 127-qubit Eagle processor with error mitigation (zero-noise extrapolation) measured accurate expectation values for circuit volumes beyond brute-force classical computation. The paper claims evidence of utility, explicitly weaker than a quantum-advantage claim, and the qualifier brute-force is load-bearing: subsequent classical methods (e.g. sparse Pauli dynamics, arXiv:2306.16372) reproduced the same expectation values orders of magnitude faster than the quantum walltime.

- Source: Kim et al., Nature 618, 500-505 (2023); Begusic et al., arXiv:2306.16372
- URL: https://www.nature.com/articles/s41586-023-06096-3
- Confidence: verified-by-search

### Below-threshold quantum error correction (Google Willow)

Google Quantum AI and Collaborators, Quantum error correction below the surface code threshold, Nature 638, 920-926 (2025; published online December 2024; arXiv:2408.13687): increasing surface-code distance from 5 to 7 suppressed logical error by a factor Lambda = 2.14 plus or minus 0.02 per distance-2 step, reaching 0.143 plus or minus 0.003 percent error per cycle for a 101-qubit distance-7 code, whose logical memory exceeded the best physical qubit's lifetime by a factor of 2.4 plus or minus 0.3. Note the paper itself does not use the marketing name Willow; that name and the 105-qubit count come from Google's announcement. The 101 qubits exceed the textbook 2d^2 - 1 = 97 for d = 7 because the experiment uses additional qubits (e.g. for leakage removal).

- Source: Google Quantum AI, Nature 638, 920-926 (2025), arXiv:2408.13687
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### 2025 verifiable-advantage claim (Quantum Echoes), vendor-claimed

On 22 October 2025 Google Quantum AI published a Nature paper (Observation of constructive interference at the edge of quantum ergodicity) running an out-of-time-order correlator (OTOC) algorithm branded Quantum Echoes on Willow: the experiment took about 2 hours, versus a task Google estimates would require 13,000 times longer on a classical supercomputer. Google calls the result verifiable because the measured quantum expectation values are repeatable and should agree across comparable quantum hardware, unlike one-time random-circuit bitstrings. This is a vendor claim whose classical-cost estimate is under active community scrutiny (Google's own 2019 classical estimate fell to spoofing); broad commercial advantage remains undemonstrated.

- Source: Google Research blog, A verifiable quantum advantage (22 Oct 2025), with Nature publication
- URL: https://research.google/blog/a-verifiable-quantum-advantage/
- Confidence: verified-by-fetch

### Uncertain / do not assert

- CHANGED (heavy-hex): date-scoped the 'all IBM devices use heavy-hex' statement to August 2021 and added the contradicting update that IBM Nighthawk (Nov 2025, 120 qubits) uses a square lattice; a present-tense heavy-hex-everywhere claim is now false.

- CHANGED (Qiskit Pulse): added that IBM removed backend Qiskit Pulse support on 3 Feb 2025 and Qiskit SDK 2.0 removed qiskit.pulse; the paper is real but pulse-level cloud access is no longer a live IBM capability.

- CHANGED (gate times): removed the unpinned '0.3 to 0.45 microsecond cross-resonance CNOT' range and replaced it with the pinned Sheldon et al. 2016 figure of 160 ns at 99.1 percent fidelity with a 20 ns DRAG pulse; the old range had no primary source and reads as outdated for modern IBM ECR/CZ gates.

- CHANGED (Feynman): the original URL pointed to the Science page for Lloyd 1996, not Feynman 1982; replaced with the Springer DOI link (10.1007/BF02650179). Page range 467-488 matches standard bibliographic records but the Springer page is paywalled, so it was not confirmed by direct fetch.

- CHANGED (Willow QEC): journal reference completed to Nature 638, 920-926 (2025); noted the paper does not use the name Willow and that 101 qubits exceeds the textbook 2d^2-1=97 for d=7 because of extra experiment qubits.

- CHANGED (Kim 2023): added that sparse-Pauli-dynamics classical simulation (arXiv:2306.16372) later reproduced the results faster than the quantum walltime, so the claim must keep the brute-force qualifier.

- CHANGED (parallelism framing): upgraded from unverified to verified-by-fetch since Grover's fetched abstract itself describes superposition plus phase interference reinforcing correct solutions, and no fetched anchor commits the tries-all-answers fallacy.

- UNPINNED: whether the Arute 2019 Nature abstract names Summit specifically as the comparison machine; the 200 s vs 10,000 years figures were confirmed only through secondary summaries of the paper (Nature page is behind a redirect wall).

- UNPINNED: independent classical-cost validation of the Quantum Echoes 13,000x figure; as of August 2026 it rests on Google's own estimate.

- UNPINNED: the exact per-vendor FPGA sequencer architectures behind current IBM/Google control stacks; Krantz et al. is the canonical review but specific present-day hardware details were not fetched.

- NOT INDEPENDENTLY RE-FETCHED: Lloyd 1996 Science page (paywall); citation details confirmed by search listings only.


## qec

### No-cloning theorem forbids copying quantum states

Wootters and Zurek showed the linearity of quantum mechanics forbids replicating an unknown quantum state (the no-cloning theorem), Nature 299, 802-803 (1982); Dieks independently proved the same result the same year (Phys. Lett. A 92, 271-272 (1982)). This is why QEC cannot use classical copy-based redundancy and instead spreads logical information across entangled physical qubits.

- Source: W. K. Wootters and W. H. Zurek, A single quantum cannot be cloned, Nature 299, 802-803 (1982); D. Dieks, Communication by EPR devices, Phys. Lett. A 92, 271 (1982)
- URL: https://www.nature.com/articles/299802a0
- Confidence: verified-by-search

### QEC origin: Shor 1995

Peter Shor showed how to reduce decoherence for information stored in quantum memory using a quantum analog of classical error-correcting codes (the 9-qubit code), Phys. Rev. A 52, R2493(R), published October 1, 1995.

- Source: P. W. Shor, Scheme for reducing decoherence in quantum computer memory, Phys. Rev. A 52, R2493 (1995)
- URL: https://link.aps.org/doi/10.1103/PhysRevA.52.R2493
- Confidence: verified-by-search

### QEC origin: Steane 1996

Andrew Steane independently established the link between quantum theory and classical linear error-correcting codes, Phys. Rev. Lett. 77, 793-797, published July 29, 1996. Together with Shor 1995 this founded quantum error correction. In both constructions, syndrome measurements reveal which error occurred without measuring, and therefore without collapsing, the encoded logical information; the general stabilizer formalism that systematizes this came later with Gottesman (PhD thesis 1997, quant-ph/9705052) and Calderbank-Rains-Shor-Sloane.

- Source: A. M. Steane, Error Correcting Codes in Quantum Theory, Phys. Rev. Lett. 77, 793 (1996)
- URL: https://link.aps.org/doi/10.1103/PhysRevLett.77.793
- Confidence: verified-by-search

### Surface code threshold approximately 1 percent

Fowler, Mariantoni, Martinis, Cleland (Phys. Rev. A 86, 032324 (2012), arXiv:1208.0928) state the surface code tolerates a per-operation error rate as high as about 1 percent, versus per-step thresholds of about 2e-5 for Steane and Bacon-Shor codes on 2D nearest-neighbor lattices. Their own numerical simulation gives a per-step threshold p_th = 0.57 percent under their specific error model. Print both: canonical shorthand about 1 percent, Fowler et al.'s own number 0.57 percent per step.

- Source: Fowler et al., Surface codes: Towards practical large-scale quantum computation, Phys. Rev. A 86, 032324 (2012); quotes extracted from the arXiv PDF full text
- URL: https://arxiv.org/abs/1208.0928
- Confidence: verified-by-fetch

### Physical qubits per surface code logical qubit

Fowler et al. 2012 (full text): a distance-d logical qubit in their array uses n_q = (2d-1)^2 total data plus measurement qubits (d=5 example in the paper: 41 data plus 40 measure = 81). The alternative standard counting is d^2 data qubits plus d^2-1 measure qubits = 2d^2-1 on a d x d data grid. At target error rates around one tenth of threshold, Fowler et al. estimate a logical qubit needs roughly 10^3 to 10^4 physical qubits for logical error rates of 1e-14 to 1e-15.

- Source: Fowler et al., Phys. Rev. A 86, 032324 (2012), full-text extraction
- URL: https://arxiv.org/abs/1208.0928
- Confidence: verified-by-fetch

### Google Willow below-threshold demonstration (Nature, Dec 2024)

Google Quantum AI, Quantum error correction below the surface code threshold (arXiv:2408.13687; Nature 638, 920-926 (2025), published online December 9, 2024): on the 105-qubit Willow superconducting processor, logical error rate is suppressed by a factor Lambda = 2.14 plus or minus 0.02 for each increase of code distance by two, culminating in a 101-qubit distance-7 code with 0.143 percent plus or minus 0.003 percent error per cycle of error correction. The distance-7 logical memory exceeded the lifetime of its best physical qubit by a factor of 2.4 plus or minus 0.3. Note the exact framing: Lambda = 2.14 means error roughly halves (more precisely divides by 2.14) going d=3 to 5 to 7.

- Source: Google Quantum AI, arXiv:2408.13687 abstract (fetched in prior pass); Nature 638, 920 (2025) confirmed via Nature/ADS listings
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Real-time decoding: cycle time and decoder latency

Willow paper (arXiv:2408.13687): surface code cycle time 1.1 microseconds; the integrated real-time decoder maintained an average decoder latency of 63 microseconds at distance 5 over up to a million cycles. The decoder must keep pace with syndrome generation at roughly one round per microsecond in superconducting hardware. Baseline decoding algorithm is Edmonds minimum-weight perfect matching (MWPM), named explicitly in Fowler et al. 2012 as running in classical control software.

- Source: Google Quantum AI arXiv:2408.13687 (fetched in prior pass); Fowler et al. Phys. Rev. A 86, 032324 (2012) full text for MWPM
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Hardware decoders beyond MWPM (Riverlane)

Riverlane published a dedicated QEC decoder in Nature Electronics (Barber et al., A real-time, scalable, fast and resource-efficient decoder for a quantum computer, Nature Electronics 8 (2025); arXiv:2309.05558): the Collision Clustering decoder decodes above 1 MHz on an 881-qubit surface code on FPGA and on a 1,057-qubit (distance-23) surface code as an ASIC drawing 8 mW in 0.06 mm2. CORRECTED from the earlier draft: the 1,057-qubit figure is the ASIC only; the FPGA reaches 881 qubits. Riverlane's follow-on Local Clustering Decoder (separate paper, arXiv:2411.10343) performs one decoding round in under 1 microsecond in real time on FPGA.

- Source: Barber et al., Nature Electronics s41928-024-01319-5; primary figures cross-checked against arXiv:2309.05558 full text and arXiv:2411.10343
- URL: https://arxiv.org/abs/2309.05558
- Confidence: verified-by-search

### Willow rare correlated error floor

The Willow paper reports performance is limited by rare correlated error events occurring approximately once per hour (roughly every 3e9 cycles), a key open problem for scaling.

- Source: Google Quantum AI, arXiv:2408.13687 abstract
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Microsoft plus Quantinuum: 12 logical qubits (Sept 2024)

On September 10, 2024, Microsoft and Quantinuum announced 12 logical qubits created on Quantinuum's 56-qubit H2 trapped-ion machine (99.8 percent two-qubit fidelity). Entangled (GHZ-type state), the 12 logical qubits showed a circuit error rate of 0.0011, 22 times better than the corresponding physical-qubit circuit error rate of 0.024. Earlier, April 2024: 4 logical qubits from 30 physical with logical error rate 800 times better than physical. All figures re-verified against the blog text this pass. Referee note: this is a vendor announcement; the underlying qubit-virtualization results are in Quantinuum/Microsoft arXiv preprints and error rates are per-protocol circuit error rates, not a universal logical gate error rate.

- Source: Microsoft Azure Quantum Blog, Microsoft and Quantinuum create 12 logical qubits, Sept 10, 2024 (fetched this pass)
- URL: https://azure.microsoft.com/en-us/blog/quantum/2024/09/10/microsoft-and-quantinuum-create-12-logical-qubits-and-demonstrate-a-hybrid-end-to-end-chemistry-simulation/
- Confidence: verified-by-fetch

### Harvard/QuEra: 48 logical qubits (Nature 2024)

Bluvstein et al., Logical quantum processor based on reconfigurable atom arrays, Nature 626, 58-65 (2024), published online December 6, 2023 (arXiv:2312.03982): neutral-atom processor with up to 280 physical qubits ran sampling circuits with 48 logical qubits encoded in 3D [[8,3,2]] code blocks (228 logical two-qubit gates, 48 logical CCZ gates), demonstrated improvement of a two-qubit logic gate when scaling surface code distance d=3 to d=7, and operated 40 color-code qubits. CORRECTED from the earlier draft: publication is Nature 626, 58-65 (2024), online December 6, 2023, not "January 2024". All abstract figures re-confirmed by fetch this pass.

- Source: Bluvstein et al., arXiv:2312.03982 (fetched this pass); Nature 626, 58-65 (2024), DOI 10.1038/s41586-023-06927-3
- URL: https://arxiv.org/abs/2312.03982
- Confidence: verified-by-fetch

### RSA-2048 resource estimate: 20 million qubits (2019)

Gidney and Ekera, How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits (Quantum 5, 433 (2021); arXiv:1905.09749): 20 million noisy physical qubits, 8 hours, assuming physical gate error rate 1e-3, surface code cycle time 1 microsecond, reaction time 10 microseconds, planar nearest-neighbor grid. The number is 20 million, not 1 million.

- Source: Gidney and Ekera, Quantum 5, 433 (2021), arXiv:1905.09749 (fetched in prior pass)
- URL: https://arxiv.org/abs/1905.09749
- Confidence: verified-by-fetch

### RSA-2048 estimate updated: under 1 million qubits (2025)

Gidney, How to factor 2048 bit RSA integers with less than a million noisy qubits (arXiv:2505.15917, 2025): fewer than one million noisy qubits running for less than a week, same hardware assumptions as 2019 (uniform 0.1 percent gate error, 1 microsecond surface code cycle, 10 microsecond control-system reaction time, square grid with nearest-neighbor connections), a 20x qubit reduction versus the 2019 estimate, achieved via approximate residue arithmetic (Chevignard et al. 2024), yoked surface codes for idle logical qubits, and magic state cultivation. Runtime is longer than the 2019 8-hour figure because fewer magic state factories run more Toffoli gates. Any current explainer must cite this alongside the 2019 figure. Re-verified against the abstract this pass.

- Source: C. Gidney, arXiv:2505.15917 (fetched this pass)
- URL: https://arxiv.org/abs/2505.15917
- Confidence: verified-by-fetch

### IBM Starling 2029 target

IBM (newsroom, June 10, 2025): IBM Quantum Starling, to be delivered by 2029 at Poughkeepsie, NY, is targeted to run 100 million quantum operations using 200 logical qubits, described as 20,000 times more operations than today's quantum computers. Successor IBM Quantum Blue Jay targets 1 billion quantum operations over 2,000 logical qubits (IBM's roadmap places Blue Jay around 2033). IBM's newsroom wording is quantum operations; some IBM blog copy says gates. Use operations. Referee note: these are roadmap targets from a vendor press release, not demonstrated results; present them as announced targets, never as achieved capability.

- Source: IBM Newsroom press release, June 10, 2025 (fetched in prior pass)
- URL: https://newsroom.ibm.com/2025-06-10-IBM-Sets-the-Course-to-Build-Worlds-First-Large-Scale,-Fault-Tolerant-Quantum-Computer-at-New-IBM-Quantum-Data-Center
- Confidence: verified-by-fetch

### Pauli frame tracking

Most Pauli corrections are not applied as physical pulses; they are tracked in classical software as a Pauli frame and folded into the interpretation of later gates and measurements. The technique traces to Knill, Quantum computing with realistically noisy devices, Nature 434, 39-44 (2005); a dedicated treatment is Chamberland, Iyer, Poulin, Fault-tolerant quantum computing in the Pauli or Clifford frame with slow error diagnostics, Quantum 2, 43 (2018) (citation confirmed against quantum-journal.org this pass; arXiv:1704.06662). Fowler et al. 2012 likewise describe error tracking running in the classical control software.

- Source: E. Knill, Nature 434, 39 (2005); Chamberland, Iyer, Poulin, Quantum 2, 43 (2018)
- URL: https://www.nature.com/articles/nature03350
- Confidence: verified-by-search

### Uncertain / do not assert

- Dieks 1982 co-attribution added to the no-cloning claim (Phys. Lett. A 92, 271-272, Communication by EPR devices) is standard textbook attribution but was not independently fetched this pass; verify the page range before print.

- Willow figures (Lambda 2.14, 0.143 percent per cycle, 63 microsecond decoder latency, 1.1 microsecond cycle, once-per-hour correlated events) were fetch-verified in the prior pass and match this referee's knowledge, but WebFetch was rate-limited when re-checking arXiv:2408.13687 this pass; they were not re-fetched.

- Nature 638 page range 920-926 and online date December 9, 2024 for the Willow paper: consistent with listings but not re-fetched from nature.com this pass (nature.com fetch redirects to a login IDP).

- Gottesman stabilizer-formalism attribution added to the Steane claim (PhD thesis 1997, quant-ph/9705052) is canonical but was not search-verified this pass.

- Riverlane Nature Electronics volume/page (Nature Electronics 8, 2025) and exact publication date: title and figures confirmed via the arXiv primary (2309.05558) and the nature.com listing title, but volume and pages were not fetched; confirm before citing volume/page.

- Microsoft/Quantinuum 99.8 percent two-qubit fidelity and the 22x/800x figures come from a vendor blog; the peer-reviewed or arXiv primary (e.g. the Quantinuum qubit-virtualization preprint) was not fetched to cross-check the exact protocol behind the circuit error rates.

- IBM 20,000x more operations comparator baseline is IBM marketing framing; no independent primary defines what today's quantum computers means in that ratio.


## resources

### MIT OCW 18.435J Quantum Computation, taught by Peter Shor

MIT OpenCourseWare 18.435J Quantum Computation (Fall 2003), instructor Prof. Peter Shor; covers physics of information processing, quantum logic, Shor's factoring algorithm, Grover's search, quantum error correction, quantum communication, and cryptography. Free lecture notes, problem sets, and exams under Creative Commons.

- Source: MIT OpenCourseWare
- URL: https://ocw.mit.edu/courses/18-435j-quantum-computation-fall-2003/
- Confidence: verified-by-fetch

### MIT OCW 8.370x Quantum Information Science I (Chuang and Shor)

MIT OpenCourseWare 8.370x Quantum Information Science I (Spring 2018), instructors Prof. Isaac Chuang and Prof. Peter Shor; covers quantum mechanics, reversible computation, measurement, teleportation, superdense coding, Deutsch-Jozsa, Simon's, Grover's, and Shor's algorithms, and quantum key distribution. The original MITx 8.370.1x-3x series is archived free on the MIT Open Learning Library, accessible without registering.

- Source: MIT OpenCourseWare
- URL: https://ocw.mit.edu/courses/8-370x-quantum-information-science-i-spring-2018/
- Confidence: verified-by-fetch

### Preskill Ph219 lecture notes at Caltech

John Preskill's Ph219/CS219 Quantum Computation sequence at Caltech; most recent verified iteration is Spring 2024 (Ph/CS 219C, quantum Shannon theory), with prior terms covering density operators, entanglement, circuits, algorithms (219A) and quantum error correction plus fault tolerance (219B). Free lecture notes linked from the course pages; notes index at theory.caltech.edu/~preskill/ph219/.

- Source: Caltech, John Preskill Ph219 course page
- URL: https://www.preskill.caltech.edu/ph219/ph219_2024.html
- Confidence: verified-by-fetch

### IBM Quantum Learning platform (successor to the Qiskit Textbook)

IBM Quantum Learning hosts a library of 10+ courses including 'Basics of Quantum Information' by John Watrous, plus six learning paths (Introduction to Quantum, Optimization, Data Science, Physics and Chemistry, Quantum Algorithm Development, QISE). learning.quantum.ibm.com returns a 301 redirect to quantum.cloud.ibm.com/learning.

- Source: IBM Quantum
- URL: https://quantum.cloud.ibm.com/learning
- Confidence: verified-by-fetch

### Microsoft Quantum Katas (now QDK Learning in VS Code)

The Quantum Katas are free self-paced lessons teaching quantum computing and Q#, now delivered as QDK Learning inside the Microsoft QDK extension for Visual Studio Code (theory lessons plus hands-on Q# exercises, progress tracking, Copilot assistance); no Azure subscription needed, but they are no longer a standalone in-browser experience. The original repo github.com/microsoft/QuantumKatas is archived read-only.

- Source: Microsoft Learn (Azure Quantum)
- URL: https://learn.microsoft.com/en-us/azure/quantum/katas-qdk-learning
- Confidence: verified-by-fetch

### 3Blue1Brown Grover video (2025) exists and is the right framing

'But what is quantum computing? (Grover's Algorithm)', channel 3Blue1Brown, published April 30, 2025, runtime about 37 minutes; explicitly dispels the 'quantum computers check all answers in parallel' misconception, teaching state vectors and amplitude rotation instead. Companion lesson at 3blue1brown.com/lessons/grover/.

- Source: YouTube, 3Blue1Brown channel
- URL: https://www.youtube.com/watch?v=RQWpF2Gb-gU
- Confidence: verified-by-search

### 3Blue1Brown follow-up clarification video

'Where my explanation of Grover's algorithm failed', channel 3Blue1Brown, 2025 follow-up clarifying the setup of Grover's algorithm and the central role of linearity in quantum computing. Companion lesson at 3blue1brown.com/lessons/grover-clarification.

- Source: YouTube, 3Blue1Brown channel
- URL: https://www.youtube.com/watch?v=Dlsa9EBKDGI
- Confidence: verified-by-search

### Google Quantum AI error correction video

'Demonstrating Quantum Error Correction', channel Google Quantum AI, published February 22, 2023, accompanying Google's Nature 2023 milestone 'Suppressing quantum errors by scaling a surface code logical qubit', which showed a larger surface code suppressing logical error.

- Source: YouTube, Google Quantum AI channel
- URL: https://www.youtube.com/watch?v=_ugJLuJ1_gM
- Confidence: verified-by-search

### Computerphile superposition video

'Superposition in Quantum Computers - Computerphile', with Prof. Phil Moriarty, published October 26, 2021, explaining superposition via waves.

- Source: YouTube, Computerphile channel
- URL: https://www.youtube.com/watch?v=kv-YXKRUheQ
- Confidence: verified-by-search

### Computerphile Shor's algorithm video

'Shor's Algorithm for Quantum Computing - Computerphile', a computer scientist and a physicist discussing Shor's factorisation algorithm.

- Source: YouTube, Computerphile channel
- URL: https://www.youtube.com/watch?v=k_kyepATqB8
- Confidence: verified-by-search

### Microsoft Research talk for programmers

'Quantum Computing for Computer Scientists' by Andrew Helwer, an 88-minute Microsoft Research talk (2018) that, per its own abstract, 'discards hand-wavy pop-science metaphors' and builds up from basic linear algebra, ending with a Deutsch-oracle demo in Q# on the Microsoft Quantum Development Kit.

- Source: YouTube, Microsoft Research channel; microsoft.com/en-us/research/video/quantum-computing-computer-scientists/
- URL: https://www.youtube.com/watch?v=F_Riqjdh2oM
- Confidence: verified-by-search

### Stanford Susskind quantum mechanics lectures (Theoretical Minimum)

'Lecture 1 | The Theoretical Minimum' (Leonard Susskind, Stanford Continuing Studies, Winter 2012 course, video published January 9, 2012); full quantum mechanics playlist PL701CD168D02FF56F on Stanford's YouTube presence, companion site theoreticalminimum.com.

- Source: YouTube, Stanford
- URL: https://www.youtube.com/watch?v=iJfw6lDlTuA
- Confidence: verified-by-search

### Feynman 1982

R. P. Feynman, 'Simulating Physics with Computers', International Journal of Theoretical Physics 21, 467-488 (1982), DOI 10.1007/BF02650179; based on his May 1981 keynote at the First Conference on the Physics of Computation, MIT Endicott House.

- Source: Springer, International Journal of Theoretical Physics
- URL: https://link.springer.com/article/10.1007/BF02650179
- Confidence: verified-by-search

### Shor 1994 factoring algorithm

P. W. Shor, 'Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer', arXiv:quant-ph/9508027, SIAM J. Comput. 26, 1484 (1997); journal version of the 1994 FOCS paper.

- Source: arXiv
- URL: https://arxiv.org/abs/quant-ph/9508027
- Confidence: verified-by-fetch

### Grover 1996 search algorithm

L. K. Grover, 'A fast quantum mechanical algorithm for database search', arXiv:quant-ph/9605043 (1996); O(sqrt(N)) queries vs classical O(N).

- Source: arXiv
- URL: https://arxiv.org/abs/quant-ph/9605043
- Confidence: verified-by-fetch

### Cirac-Zoller 1995 trapped-ion gate proposal

J. I. Cirac and P. Zoller, 'Quantum Computations with Cold Trapped Ions', Physical Review Letters 74, 4091 (15 May 1995); gates via the ions' collective quantized motion.

- Source: APS Physical Review Letters
- URL: https://link.aps.org/doi/10.1103/PhysRevLett.74.4091
- Confidence: verified-by-search

### Molmer-Sorensen 1999 gate

K. Molmer and A. Sorensen, 'Multi-particle entanglement of hot trapped ions', arXiv:quant-ph/9810040 (submitted October 14, 1998), published Physical Review Letters 82, 1835-1838 (1999); entangling gate that works without ground-state cooling.

- Source: arXiv
- URL: https://arxiv.org/abs/quant-ph/9810040
- Confidence: verified-by-fetch

### Koch 2007 transmon paper

J. Koch et al., 'Charge insensitive qubit design derived from the Cooper pair box', arXiv:cond-mat/0703002 (2007), published Physical Review A 76, 042319 (2007); the transmon qubit.

- Source: arXiv
- URL: https://arxiv.org/abs/cond-mat/0703002
- Confidence: verified-by-fetch

### Krantz 2019 superconducting-qubit guide

P. Krantz, M. Kjaergaard, F. Yan, T. P. Orlando, S. Gustavsson, W. D. Oliver, 'A Quantum Engineer's Guide to Superconducting Qubits', arXiv:1904.06560, published Applied Physics Reviews 6, 021318 (2019).

- Source: arXiv
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Motzoi 2009 DRAG pulses

F. Motzoi, J. M. Gambetta, P. Rebentrost, F. K. Wilhelm, 'Simple pulses for elimination of leakage in weakly nonlinear qubits', arXiv:0901.0534, published Physical Review Letters 103, 110501 (2009).

- Source: arXiv
- URL: https://arxiv.org/abs/0901.0534
- Confidence: verified-by-fetch

### Macklin 2015 TWPA

C. Macklin et al., 'A near-quantum-limited Josephson traveling-wave parametric amplifier', Science 350, 307-310 (2015), DOI 10.1126/science.aaa8525; gain over a several-GHz bandwidth with dynamic range sufficient to read out about 20 superconducting qubits.

- Source: Science (AAAS)
- URL: https://www.science.org/doi/10.1126/science.aaa8525
- Confidence: verified-by-search

### Preskill 2018 NISQ paper

J. Preskill, 'Quantum Computing in the NISQ era and beyond', arXiv:1801.00862, published Quantum 2, 79 (2018).

- Source: arXiv
- URL: https://arxiv.org/abs/1801.00862
- Confidence: verified-by-fetch

### Arute 2019 quantum supremacy paper

F. Arute et al., 'Quantum supremacy using a programmable superconducting processor', Nature 574, 505-510 (October 2019), DOI 10.1038/s41586-019-1666-5; the 53-qubit Sycamore processor took about 200 seconds to sample one instance of a quantum circuit a million times. Freely readable at the Nature URL.

- Source: Nature
- URL: https://www.nature.com/articles/s41586-019-1666-5
- Confidence: verified-by-search

### Google 2024 below-threshold error correction (Willow-generation processor)

R. Acharya et al. (Google Quantum AI and collaborators), 'Quantum error correction below the surface code threshold', arXiv:2408.13687 (submitted August 24, 2024), published Nature 638, 920-926 (2025); a 101-qubit distance-7 surface code with 0.143% +/- 0.003% error per cycle, logical memory exceeding the best physical qubit lifetime by a factor of 2.4 +/- 0.3, and error suppression factor 2.14 +/- 0.02 per distance-2 increase.

- Source: arXiv
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Harvard/QuEra logical processor paper

D. Bluvstein et al., 'Logical quantum processor based on reconfigurable atom arrays', arXiv:2312.03982 (December 2023), published Nature 626, 58-65 (2024); the neutral-atom demonstration operating up to 48 logical qubits.

- Source: arXiv
- URL: https://arxiv.org/abs/2312.03982
- Confidence: verified-by-fetch

### Gidney-Ekera 2019 RSA cost estimate

C. Gidney and M. Ekera, 'How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits', arXiv:1905.09749 (2019), published Quantum 5, 433 (2021); assumes physical gate error rates around 10^-3. Note: superseded as the state-of-the-art estimate by Gidney 2025 (see next claim).

- Source: arXiv
- URL: https://arxiv.org/abs/1905.09749
- Confidence: verified-by-fetch

### Gidney 2025 updated RSA cost estimate (supersedes 2019 figure)

C. Gidney, 'How to factor 2048 bit RSA integers with less than a million noisy qubits', arXiv:2505.15917 (May 2025); estimates factoring 2048-bit RSA in under a week with fewer than one million noisy physical qubits, a roughly 20x qubit reduction over the 2019 estimate, via approximate residue arithmetic, yoked surface codes, and reduced magic-state space.

- Source: arXiv
- URL: https://arxiv.org/abs/2505.15917
- Confidence: verified-by-search

### IBM official explainer

'What Is Quantum Computing?' on IBM Think Topics; official IBM explainer framing quantum computing as harnessing quantum mechanics for problems too complex for classical computers. Direct fetch blocked by bot protection; existence and title confirmed via search listings.

- Source: IBM
- URL: https://www.ibm.com/think/topics/quantum-computing
- Confidence: verified-by-search

### Bluefors dilution refrigerator explainer

'How Does a Dilution Refrigerator Work?' on Bluefors.com; official vendor explainer stating He-3/He-4 mixtures phase-separate below 0.87 kelvin (exact temperature depends on He-3 concentration), cooling occurs as He-3 is pumped through the phase boundary in the mixing chamber, incoming helium is precooled to about 3 K by a pulse tube cryocooler, and base temperatures reach below 10 millikelvin.

- Source: Bluefors
- URL: https://bluefors.com/stories/how-does-a-dilution-refrigerator-work/
- Confidence: verified-by-fetch

### Google Quantum AI educational resources page

'Educational Resources' at quantumai.google/resources: the 'What is Quantum Computing?' whitepaper, how-to videos from the Quantum AI team, a virtual lab tour descending into the cryostat, the Qubit Game, and a link to enroll in the Coursera quantum error correction course.

- Source: Google Quantum AI
- URL: https://quantumai.google/resources
- Confidence: verified-by-fetch

### Google Quantum AI Coursera error-correction course

'Hands-on quantum error correction with Google Quantum AI' on Coursera (partner: Google Quantum AI); by the end students have implemented the surface code, a leading error correcting code. Enrollment via Coursera; financial aid and a free trial are offered, but a free audit option is not explicitly confirmed on the course page.

- Source: Coursera, Google Quantum AI
- URL: https://www.coursera.org/learn/quantum-error-correction
- Confidence: verified-by-fetch

### Parallelism-fallacy audit of this resource set

None of the anchored resources above presents the 'tries all 2^n answers at once' framing as physics; the 3Blue1Brown Grover video explicitly dispels that misconception and teaches the correct picture: n qubits hold amplitudes over 2^n basis states, algorithms choreograph interference, and measurement yields one outcome.

- Source: 3Blue1Brown lesson page (3blue1brown.com/lessons/grover/) plus the verified sources listed above
- URL: https://www.3blue1brown.com/lessons/grover/
- Confidence: verified-by-search

### Uncertain / do not assert

- CHANGED - Preskill claim: original said 'most recent iteration Spring 2023'; a Spring 2024 iteration exists and was fetch-verified, so the claim now anchors to ph219_2024.html. No 2025 or 2026 iteration was found in search; whether the course ran after Spring 2024 is unpinned. Also note theory.caltech.edu currently serves a certificate that fails verification on automated fetch; preskill.caltech.edu works.

- CHANGED - Microsoft Quantum Katas: original said 'runnable fully in the browser with no Azure subscription'. The learn.microsoft.com page (updated June 2026) shows the katas now live in QDK Learning inside the QDK VS Code extension; the archived GitHub README still points to the retired quantum.microsoft.com katas experience. The claim was rewritten accordingly.

- CHANGED - Coursera course: original title 'a Coursera course on quantum error correction' tightened to the exact title 'Hands-on quantum error correction with Google Quantum AI'; the 'free-to-audit' assertion could not be confirmed on the course page (only free trial and financial aid are shown) and was removed.

- CHANGED - Willow claim: added the published reference Nature 638, 920-926 (2025) and first author Acharya; 'published in Nature' in 2024 was imprecise (submitted Aug 2024, Nature issue 2025).

- ADDED - Gidney arXiv:2505.15917 (2025) as a separate claim because it supersedes the 2019 20-million-qubit estimate; any text quoting only the 2019 number is now overstated by roughly 20x on qubit count.

- UNPINNED - exact runtime 36:54 for the 3Blue1Brown Grover video: secondary listings say about 37 minutes; the exact seconds figure was not verified, so state 'about 37 minutes'.

- UNPINNED - exact publish date May 14, 2018 for the Helwer Microsoft Research talk: MSR page and 2018 coverage confirm the talk, its 88-minute length, and the verbatim abstract phrase, but not that specific day; state '2018'.

- UNPINNED - publish date of the Computerphile Shor's Algorithm video: one search summary reported July 9, 2026, which was not independently confirmed; title, channel, and URL are confirmed, so cite it without a date.

- UNPINNED - whether IBM Quantum Learning courses are free of charge: the fetched page confirms 10+ courses, the Watrous course, and six learning paths, but shows no pricing; 'free' is widely stated elsewhere but was not verified on the page.

- UNPINNED - the note that quantumai.google/learn returns 404: not retested this pass; the /resources page is confirmed live and should be the cited URL regardless.


## superconducting

### Transmon origin and charge-noise insensitivity

The transmon, introduced by Koch et al. 2007, is a charge qubit derived from the Cooper pair box operated at a significantly increased ratio of Josephson energy to charging energy EJ/EC; per the abstract, 'its charge dispersion decreases exponentially with EJ/EC, while its loss in anharmonicity is described by a weak power law.'

- Source: Koch et al., Charge insensitive qubit design derived from the Cooper pair box, Phys. Rev. A 76, 042319 (2007)
- URL: https://arxiv.org/abs/cond-mat/0703002
- Confidence: verified-by-fetch

### Transmon circuit: Josephson junction shunted by large capacitor

The Josephson junction is a nonlinear, dissipationless inductor that makes the oscillator spectrum non-degenerate so the 0-1 transition is uniquely addressable; the transmon adds a large shunt capacitance and keeps EJ/EC >= 50 to suppress charge sensitivity (Krantz full text: 'an energy ratio sufficiently large (EJ/EC >= 50) to suppress charge sensitivity').

- Source: Krantz et al., A Quantum Engineer's Guide to Superconducting Qubits, Appl. Phys. Rev. 6, 021318 (2019)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Junction materials Al/AlOx/Al

Standard transmon Josephson junctions are Al/AlOx/Al tunnel junctions (aluminum electrodes with an ultrathin aluminum-oxide barrier); Krantz refs 59-60 are Zeng et al. junction-microscopy papers on Al/AlOx/Al barriers (confirmed verbatim in the Krantz reference list).

- Source: Krantz et al. 2019, refs 59-60 (Zeng et al., J. Phys. D)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Transmon anharmonicity

For the transmon the anharmonicity alpha = omega_q(1->2) - omega_q(0->1) is negative and equals -EC; Krantz states verbatim that alpha = -EC 'is usually designed to be 100-300 MHz'. Do not write '-200 to -300 MHz'; the sourced range is -(100-300) MHz.

- Source: Krantz et al. 2019, Sec. II (full text)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Typical qubit transition frequency

Krantz states the qubit frequency omega_q = (sqrt(8 EJ EC) - EC)/hbar is designed to be 3-6 GHz (confirmed verbatim in the full text). Krantz gives 3-6 GHz, not the commonly quoted 4-8 GHz; cite Krantz for 'roughly 3-6 GHz'.

- Source: Krantz et al. 2019, Sec. II (full text)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### T1/T2 for state-of-the-art 2024 planar transmons (Google Willow)

Willow QEC chip (105 qubits): mean operating T1 = 68 us (spec sheet: 68 us +/- 13 us) and T2,CPMG = 89 us (paper supplement; T2 is not on the spec sheet); Willow RCS chip: mean T1 = 98 us +/- 32 us. During the distance-7 run the constituent physical qubits had median lifetime 85 +/- 7 us, best 119 +/- 13 us, and the logical qubit lifetime was 291 +/- 6 us.

- Source: Google Quantum AI, Quantum error correction below the surface code threshold, Nature 638 (2025), arXiv:2408.13687 supplement; Willow Spec Sheet (Dec 9, 2024)
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Single-qubit gate times

Verbatim from the Willow supplement: 'On the 105-qubit processor, all XY rotations have 25 ns duration, while on the 72-qubit processor, pi and pi/2 rotations have 35 ns duration and 18 ns duration respectively.' Single-qubit gates are resonant microwave XY rotations plus virtual Z rotations.

- Source: arXiv:2408.13687, Supplementary Information (Gates and Readout)
- URL: https://arxiv.org/html/2408.13687v1
- Confidence: verified-by-fetch

### DRAG pulse shaping

DRAG (Motzoi, Gambetta, Rebentrost, Wilhelm, PRL 103, 110501 (2009)) adds a second control proportional to the time derivative of the first pulse envelope to inhibit leakage to non-computational states in weakly nonlinear qubits; abstract and journal reference confirmed by fetch. Krantz reviews it as the standard robust single-qubit control technique.

- Source: Motzoi et al., Simple pulses for elimination of leakage in weakly nonlinear qubits, PRL 103, 110501 (2009)
- URL: https://arxiv.org/abs/0901.0534
- Confidence: verified-by-fetch

### Two-qubit gate times

Verbatim from the Willow supplement: 'Our CZ gates are performed in 42 ns on the 105-qubit processor, and 37 ns on the 72-qubit processor.' Krantz gives tau_CPHASE = 30-60 ns and tau_CR = 300-400 ns (confirmed verbatim), and Sheldon et al. reduced the cross-resonance gate to tau = 160 ns (confirmed verbatim, Krantz ref 203). State ranges by mechanism: tunable-coupler CZ about 35-60 ns, cross-resonance historically 160-400 ns; avoid a single '20-200 ns typical' figure.

- Source: arXiv:2408.13687 Supplementary Information; Krantz et al. 2019 Sec. IV G
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Best current two-qubit error rates (Google Willow)

Willow spec sheet (read directly from the PDF): QEC chip mean simultaneous two-qubit (CZ) gate error 0.33% +/- 0.18%, single-qubit gate error 0.035% +/- 0.029%, measurement error 0.77% +/- 0.21% (repetitive, measure qubits); RCS chip two-qubit error 0.14% +/- 0.052% (iswap-like), single-qubit 0.036% +/- 0.013%, measurement 0.67% +/- 0.51% (terminal, all qubits). Correction to the input: the iswap-like spread is 0.052%, not 0.05%, and the 0.77% measurement error is the QEC chip's repetitive readout figure.

- Source: Google Quantum AI, Willow Spec Sheet, published Dec 9 2024
- URL: https://quantumai.google/static/site-assets/downloads/willow-spec-sheet.pdf
- Confidence: verified-by-fetch

### IBM Heron two-qubit error rates

REWRITTEN, original anchor was misattributed: IBM Research (APS Global Physics Summit 2025 abstract) describes 'tunable-coupling Heron processors with two-qubit gate error rates approaching 0.1%', and IBM's newsroom states 'The IBM Quantum Heron r3 boasts 156 qubits with a median two-qubit error rate of just 1.17E-3' (May 4, 2026). So current Heron median two-qubit errors are roughly 1e-3 to 3e-3 by generation, best gates approaching 1e-3.

- Source: IBM newsroom, A Decade of Quantum on the Cloud (2026-05-04); IBM Research, Noise characterization and error mitigation on IBM Heron processors (APS 2025)
- URL: https://newsroom.ibm.com/2026-05-04-ibm-a-decade-of-quantum-on-the-cloud
- Confidence: verified-by-fetch

### Two-qubit gate mechanisms: tunable-coupler CZ (Google) and cross-resonance (IBM legacy)

Google implements entangling operations as CZ gates on grids of transmons with tunable couplers (Willow supplement, verified); IBM's all-microwave cross-resonance gate on fixed-frequency transmons is reviewed in Krantz Sec. IV G (verified in full text); IBM Research confirms Heron is a tunable-coupling architecture (verified by fetch), and Heron's native two-qubit gate being CZ is corroborated by search listings of IBM materials.

- Source: arXiv:2408.13687; Krantz et al. 2019 Sec. IV; IBM Research APS 2025 abstract
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Dispersive readout mechanism

In dispersive readout the qubit induces a state-dependent dispersive shift chi of the readout resonator frequency; probing the resonator and comparing the signal in the IQ plane distinguishes qubit states. Confirmed verbatim in Krantz: readout must satisfy tau_ro << T1, F(tau_ro) = 1 - exp(-tau_ro/T1) (Eq. 173), with tau_ro = tau_rd + tau_s/2 (readout delay from the resonator transient plus half the sampling time); Purcell filters allow fast readout while protecting the qubit.

- Source: Krantz et al. 2019, Sec. V (full text)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Readout duration order of magnitude

REWRITTEN, original anchor replaced: state-of-the-art dispersive single-shot readout reaches 98.25% fidelity in 48 ns and 99.2% in 88 ns (Walter et al., Phys. Rev. Applied 7, 054020 (2017), verified by fetch), and practical high-fidelity readout on multiqubit processors runs from tens to a few hundred ns; Willow's full surface-code cycle including measurement and reset is 1.1 us (verified verbatim in arXiv:2408.13687), bounding readout well below 1 us. The previous anchor arXiv:2210.04793 is an in-situ bifurcation readout in a 3D cavity (500 ns integration, 98.6% fidelity), not standard dispersive readout, and should not anchor a 'typical' figure.

- Source: Walter et al., Rapid High-fidelity Single-shot Dispersive Readout of Superconducting Qubits, Phys. Rev. Applied 7, 054020 (2017); arXiv:2408.13687
- URL: https://arxiv.org/abs/1701.06933
- Confidence: verified-by-fetch

### TWPA near-quantum-limited amplification

Macklin et al., Science 350, 307-310 (2015): a Josephson traveling-wave parametric amplifier achieves high gain over a bandwidth of several gigahertz with dynamic range sufficient to read out 20 superconducting qubits, using resonant phase matching (abstract-level facts confirmed via search listings; the Science page returned 403 to direct fetch). The specific 20 dB gain and 75% quantum efficiency (70% including following amplifiers) figures sit in the paywalled body and are corroborated only by secondary literature; quote them with that caveat.

- Source: Macklin et al., A near-quantum-limited Josephson traveling-wave parametric amplifier, Science 350, 307-310 (2015)
- URL: https://doi.org/10.1126/science.aaa8525
- Confidence: verified-by-search

### HEMT stage and system noise

Confirmed verbatim in Krantz: 'If the first amplifier is a low-noise high-electron mobility transistor (HEMT) amplifier (TN ~ 2 K), the system noise temperature when implemented in a cryostat is around 7-10 K, corresponding to around 10-20 added photons of noise per signal photon around 5 GHz. In practice, this is generally too much noise to perform single-shot readout.' Confirmed verbatim in Krinner: 'High-electron mobility transistor (HEMT) amplifiers (LNF LNC4_8C) with a gain of about 40 dB are installed at the 4K stage.'

- Source: Krantz et al. 2019 Sec. V; Krinner et al., EPJ Quantum Technology 6, 2 (2019)
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Drive-line attenuation about 60 dB

Krinner et al.: about 60 dB total attenuation on microwave drive lines is required to reach a noise photon number around 1e-3; their selected configuration C3 = {0, 20, 0, 20, 20} dB places 20 dB at the 4 K stage, 20 dB at the cold plate, and 20 dB at the mixing chamber ('As a compromise between the number of noise photons and a low heat load on MXC we select C3, with a noise photon number of about 0.1%'). The 60 dB figure is Krinner's, not Krantz's.

- Source: Krinner et al., Engineering cryogenic setups for 100-qubit scale superconducting circuit systems, EPJ Quantum Technology 6, 2 (2019)
- URL: https://arxiv.org/abs/1806.07862
- Confidence: verified-by-fetch

### Control electronics: AWG baseband plus IQ mixing

Confirmed verbatim in Krantz Sec. IV D: pulses are generated by an AWG, typically with a low-frequency component omega_AWG, combined in an IQ mixer with a local oscillator so that omega_d = omega_LO +/- omega_AWG is resonant with the qubit; mixing in multiple omega_AWG components enables frequency multiplexing.

- Source: Krantz et al. 2019, Sec. IV D (full text)
- URL: https://arxiv.org/abs/1904.06560
- Confidence: verified-by-fetch

### Willow surface-code headline result (context anchor)

Confirmed: a 101-qubit distance-7 surface code with 0.143% +/- 0.003% error per cycle, error suppression factor Lambda = 2.14 +/- 0.02 per distance-2 increase, and logical lifetime 291 +/- 6 us, exceeding the best constituent physical qubit by 2.4 +/- 0.3. None of the anchor sources verified here uses the forbidden 'tries all answers at once' or '2^n parallel computations' framing.

- Source: Google Quantum AI, Quantum error correction below the surface code threshold, Nature (2025), arXiv:2408.13687
- URL: https://arxiv.org/abs/2408.13687
- Confidence: verified-by-fetch

### Uncertain / do not assert

- ibm_torino (Heron r1) median CZ error 3.7e-3 to 5.1e-3: could not be pinned to any primary source; the originally cited arXiv:2507.08088 is a (2+1)-D gauge-theory simulation paper whose abstract reports no per-device calibration medians. Removed from the claim set.

- ibm_kingston (Heron r2) median two-qubit error 2.03e-3: appeared only in a search-result summary attributed to an IBM blog that returned HTTP 403 to direct fetch; plausible but not independently pinned.

- IBM statement that Heron improved median two-qubit error roughly an order of magnitude over Eagle (about 2%): no IBM primary source found stating this; Eagle-era two-qubit errors were on the order of 1e-2, and the 'order of magnitude' comparison in IBM's 2026 newsroom piece is against 2016-era five-qubit devices, not Eagle. Dropped.

- Macklin et al. body figures (20 dB gain, 3 GHz bandwidth number, 75% quantum efficiency, 70% including following amplifiers): behind the Science paywall; corroborated only by secondary literature, quote with a caveat.

- Whether Google Willow's 89 us T2,CPMG carries an uncertainty spread: the supplement sentence gives only the mean; the spec sheet lists no T2 at all.

- IBM Heron r3 deployment details beyond the single newsroom sentence (which systems run r3, as of 2026-08): not verified.
