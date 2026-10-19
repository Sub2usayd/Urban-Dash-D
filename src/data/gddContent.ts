export interface GddSection {
  id: string;
  title: string;
  subtitle: string;
  contentMarkdown: string;
}

export const GDD_SECTIONS: GddSection[] = [
  {
    id: 'executive-summary',
    title: '1. Executive Summary & Vision',
    subtitle: 'High Concept, Core Pillars & Android Target Specs',
    contentMarkdown: `
### 1.1 High Concept
**Urban Dash 3D** is a lightning-paced, 3D third-person endless runner engineered specifically for mid-range and modern Android mobile devices. 

Fleeing from the relentless pursuit of the tenacious **Officer Higgins** and his agile police K9 **Buster**, the player navigates through three treacherous running lanes across seven wildly diverse global biomes. With responsive single-finger swipe and tap controls, players weave between obstacles, vault barriers, slide beneath overhead hazards, and collect coins and power-ups in an adrenaline-fueled chase where every stumble brings the sirens right to your heels.

---

### 1.2 Core Pillars
1. **Immediate Kinetic Flow & Snappy Tactility:** Zero sluggishness. Lane shifts complete in 160ms with smooth cubic easing; jumps snap with authoritative gravity; slides flatten hitboxes instantly.
2. **Dynamic Persistent Chase Tension:** The pursuers are not abstract off-screen timers—they are fully animated 3D entities in the world. When you graze an obstacle, Officer Higgins and Buster surge into frame, with sirens flashing, the dog barking, and screen vignette pulsing red.
3. **Optimized Low-Poly Vibrancy:** Bold geometric silhouettes, rich saturated palettes, and vertex-lit flat shading. Runs at a rock-solid **60 FPS** on mid-range Android chipsets (Snapdragon 680 / Helio G99 tier) with an initial download footprint under **45 MB**.
4. **Fair, Player-First Progression:** 100% of characters and gameplay upgrades are earnable through in-game skill, coins, and distance milestones. No energy meters, no pay-to-win statistics, and complete offline playability.

---

### 1.3 Target Technical Specifications (Android)
- **Target OS:** Android 9.0 (Pie / API Level 28) and above.
- **Framerate Target:** Locked **60 FPS** on 85%+ of active Android devices; 90/120Hz high-refresh rate display support.
- **Display Aspect Ratios:** Responsive scaling from 16:9 to 21:9 with safe-area notch padding.
- **Install Footprint:** Under **45 MB APK/AAB** initial install size via ASTC texture compression and shared low-poly vertex buffers.
- **Memory (RAM) Footprint:** Under **180 MB** working set at peak play. Zero garbage-collection stutter during runtime loops.
`,
  },
  {
    id: 'core-loop-mechanics',
    title: '2. Core Gameplay Loop & Mathematical Difficulty Curve',
    subtitle: 'Moment-to-Moment Verbs, Physics, and Asymptotic Scaling Formulas',
    contentMarkdown: `
### 2.1 The Gameplay Loop
\`\`\`
   ┌─────────────────────────────────────────────────────────────┐
   │                       MAIN RUN PHASE                         │
   │  • Auto-run forward at speed v(d)                           │
   │  • Swipe Left/Right: Lane Switch (3 lanes: X = -2.8, 0, 2.8)│
   │  • Swipe Up: Jump over hurdles, chasms, roots               │
   │  • Swipe Down: Slide under signs, fallen logs, laser grids  │
   │  • Collect coins, power-up items, and score multipliers     │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                       [OBSTACLE ENCOUNTER]
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
      [Clean Avoidance]                           [Stumble / Collision]
      • Distance continues                        • Full direct impact = Caught (Game Over)
      • Chase Distance lead recovers (+4.0/s)     • Graze/trip = -35 Chase Distance lead
      • Combo multiplier builds                   • Police + K9 surge forward into view
                                                  • Red vignette pulse + audible bark/siren
                                                        │
                                                        ▼
                                                  [Distance = 0?]
                                                  ├── YES ──► Apprehended Sequence (Game Over)
                                                  └── NO  ──► Scurry Recovery & High Alert
\`\`\`

---

### 2.2 Movement Physics & Controller Timing
- **Lanes:** 3 parallel lanes centered at $X = -2.8\\text{m}$ (Left), $X = 0.0\\text{m}$ (Center), and $X = +2.8\\text{m}$ (Right).
- **Lane Shift Duration:** $160\\text{ms}$ with cubic ease-out. Swipes during an active lane shift queue an immediate chained lane change (input buffering).
- **Jump Physics:**
  - Launch velocity: $v_{y0} = 14.5\\text{m/s}$
  - Gravity: $g = -42.0\\text{m/s}^2$ (authoritative fast fall for crisp arcade feel)
  - Total jump hang time: $t_{jump} = 0.69\\text{s}$
  - Peak clearance height: $y_{peak} = 2.50\\text{m}$
  - Downward swipe while airborne instantly cuts upward velocity and triggers a fast dive slide.
- **Slide Physics:**
  - Slide duration: $0.72\\text{s}$
  - Hitbox height squashes from $1.80\\text{m}$ (standing) to $0.65\\text{m}$ (sliding) instantly.
  - Upward swipe while sliding cancels the slide immediately into a jump.
- **Input Buffer & Coyote Timing:**
  - Swipe buffer window: $120\\text{ms}$ (early swipes register upon landing).
  - Coyote time: $90\\text{ms}$ grace period after running off an edge to still execute a jump.

---

### 2.3 Mathematical Difficulty Scaling Curve
Speed does not increase infinitely; it follows an asymptotic exponential decay function to guarantee human-playable reaction windows:

$$v(d) = v_{base} + (v_{max} - v_{base}) \\times \\left(1 - e^{-d / k}\\right)$$

- $v_{base} = 12.0\\text{ m/s}$ (approx. $43.2\\text{ km/h}$)
- $v_{max} = 26.0\\text{ m/s}$ (approx. $93.6\\text{ km/h}$)
- $k = 1500\\text{ m}$ (half-ramp scale distance)
- $d = \\text{distance ran in meters}$

#### Obstacle Spacing & Reaction Time Safeguard
Obstacle spawn distance $S(d)$ scales inversely with speed, but is strictly clamped by the minimum human reaction time:

$$S(d) = \\max\\left(S_{raw}(d),\\, v(d) \\times \\Delta t_{react}\\right)$$

- Minimum reaction window $\\Delta t_{react} = 0.380\\text{ seconds}$ (ensures every layout is beatable by human reflexes at maximum speed).
- Maximum starting spacing: $24.0\\text{ meters}$ (approached at $d = 0\\text{m}$).
- Minimum high-difficulty spacing: $10.0\\text{ meters}$ (approached at $d > 3000\\text{m}$).
`,
  },
  {
    id: 'chase-mechanics',
    title: '3. Chase Mechanics: Officer Higgins & Buster the K9',
    subtitle: 'Dynamic Proximity System, Threat Tiers & AI Animation State Machine',
    contentMarkdown: `
### 3.1 The Dynamic Distance Lead System
The core thrill of **Urban Dash 3D** comes from the living pursuers behind the player. Unlike typical runners where pursuers appear only on mistakes, **Officer Higgins** and **Buster the K9** exist continuously in the 3D world.

The chase state is governed by the **Distance Lead Value** $D \\in [0, 100]$:
- $D = 100$: Maximum safe lead (pursuers are approximately 14 meters behind, visible in peripheral view or rear mirror).
- $D = 0$: Caught. Higgins initiates a tackle or Buster lunges, ending the run.

#### Proximity Recovery & Loss Formula:
$$D(t + \\Delta t) = D(t) + r_{rec} \\cdot \\Delta t - \\text{Penalty}_{stumble}$$

- **Clean Running Recovery Rate ($r_{rec}$):** $+4.0\\text{ units/second}$. Maintaining a mistake-free run for 10 seconds restores $+40$ units of lead.
- **Hurdle Stumble Penalty:** $-35\\text{ units}$ immediate deduction upon clipping an obstacle or brushing an obstacle side.
- **Glancing Graze:** $-20\\text{ units}$ when grazing a side obstacle during an incomplete lane switch.

---

### 3.2 Threat Tiers & Audio-Visual Escalation

| Threat Tier | Distance Lead ($D$) | Pursuer In-World Distance | Visual Feedback | Audio Feedback |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Safe Lead** | $70 - 100$ | $12.0\\text{m} - 16.0\\text{m}$ behind | Normal view; pursuers visible in distant background. | Faint ambient running steps, distant radio chatter. |
| **Tier 2: Alert Pursuit** | $35 - 69$ | $6.5\\text{m} - 11.9\\text{m}$ behind | Officer and dog enter main frame; dog begins barking. | Audible heavy boot strides, K9 panting and occasional bark. |
| **Tier 3: Critical Strike** | $1 - 34$ | $2.2\\text{m} - 6.4\\text{m}$ behind | Pulsing red screen edge vignette; flashing red/blue siren glare; camera subtle FOV tension squeeze. | Loud rapid barking, Officer yelling "Hold it right there!", high-tempo siren wail. |
| **Tier 4: Apprehended** | $0$ | $0.0\\text{m}$ (Contact) | Dynamic slow-motion freeze; tackle or collar grab animation; comedic low-poly arrest vignette. | Dramatic brass sting, whistle blow, "Busted!" fanfare. |

---

### 3.3 AI Behaviors & Obstacle Navigation
- **Buster the K9:**
  - Buster features a dedicated jumping animation that automatically clears low hurdles and fallen logs in sync with the player.
  - When reaching Tier 3 ($D < 35$), Buster begins lunging forward during jumps, snapping at the runner's heels.
  - Buster will bark rhythmically, alerting the player of proximity even when looking strictly ahead.
- **Officer Higgins:**
  - Higgins runs with a determined, heavy-footed stride, pumping his baton and adjusting his police cap.
  - He vaults hurdles with a heavy, forceful leap that kicks up low-poly dust clouds.
  - During slide obstacles (e.g. low overhead signs), Higgins executes a comical shoulder dive or ducks beneath with an exasperated grunt.
`,
  },
  {
    id: 'character-roster',
    title: '4. The 10 Unlockable Runners: Character Dossiers',
    subtitle: 'Detailed Visual Breakdown, Polygon Budgets, Animations & Unlock Paths',
    contentMarkdown: `
### 4.1 Character Design Philosophy
All characters adhere to a **strict low-poly aesthetic**: flat-shaded faceted surfaces, zero photographic textures, vibrant readable silhouettes, and expressive exaggerated joint animations. Each character has a distinct body language, personal flair, and an earnable gameplay perk.

---

### 4.2 Runner Dossier: Starter & Unlockables

#### 1. Malik Vance ("Verve") — THE DEFAULT STARTER
- **Role & Archetype:** The Velocity Pioneer / Urban Trailblazer (First playable character).
- **Ethnicity & Background:** Athletic young Black male with confident, respectful street style. Inspired by energetic urban youth culture.
- **Visual Design:**
  - **Hair:** Short tapered dreadlocks with golden accent cuffs on three feature locks.
  - **Upperwear:** Athletic hooded track jacket in vibrant turquoise (#06B6D4) and charcoal matte weave (#1E293B) with solar-orange zipper pull.
  - **Lowerwear:** Slim-cut athletic indigo street denim (#312E81) with flex-joint stitching.
  - **Footwear:** Crisp white low-poly high-top basketball sneakers (#F8FAFC) with solar-orange tread accents (#F97316).
  - **Accessories:** Braided wrist lanyard, matte black audio earpiece, gold cuff ring.
- **Animations:** Bouncy, rhythmic stride with natural shoulder swing; spring-loaded hurdle vault with one hand on knee; low side-glide slide.
- **Unlock Condition:** Starter (Free / Immediately Playable).
- **Gameplay Perk:** *Kinetic Rhythm* — Recovers 15% faster from obstacle stumbles (stumble penalty reduced from -35 to -30).
- **Polygon Count:** 1,540 triangles.

---

#### 2. Maya Lin ("Acro")
- **Role & Archetype:** Precision Freerunner / Parkour Specialist.
- **Ethnicity & Background:** East Asian / Chinese heritage. Former competitive gymnast turned urban courier.
- **Visual Design:** Sleek high ponytail with ruby-red ribbon; ultra-lightweight crimson and graphite aerodynamic windbreaker (#EF4444); modular charcoal cargo joggers with strapped ankle cuffs; low-profile rubberized parkour grip flats with red piping; fingerless leather gloves.
- **Animations:** Mid-air tuck flip during jumps; tight baseball slide recovery; fluid cat-leap over obstacles.
- **Unlock Condition:** 500 Coins or reach 1,000m in a single run.
- **Gameplay Perk:** *Acrobat Reflex* — +20% airborne steer agility during jumps.
- **Polygon Count:** 1,480 triangles.

---

#### 3. Mateo Alvarez ("Kip")
- **Role & Archetype:** The Midnight Muralist / Street Artist.
- **Ethnicity & Background:** Latino / Colombian heritage. Celebrated street painter.
- **Visual Design:** Reversed snapback cap with loose curly brown fringe; oversized denim jacket covered in bright neon paint splatters (#EAB308, #EC4899); relaxed tan utility trousers; mustard skate shoes; dual hip spray-can holsters and a respirator slung around the collar.
- **Animations:** Loose swagger running cadence; one-handed hurdle hop; spray-paint flair during slides.
- **Unlock Condition:** 1,200 Coins or reach 2,500m in a single run.
- **Gameplay Perk:** *Paint Trail* — Coins within 3 meters are visually highlighted and magnet-pulled 10% sooner.
- **Polygon Count:** 1,620 triangles.

---

#### 4. Amina Diallo ("Cheetah")
- **Role & Archetype:** Championship Pacesetter / Track & Field Sprinter.
- **Ethnicity & Background:** West African / Senegalese heritage. National sprint medalist.
- **Visual Design:** Braided crown bun with polished brass beads; sleek gold-and-black aerodynamic athletic bodysuit with geometric chevron accents (#EAB308 / #18181B); mirrored aerodynamic speed visor; golden sprint-cleat sneakers.
- **Animations:** Textbook biomechanical sprinting cadence with high knees and long gazelle-like hurdle leaps.
- **Unlock Condition:** 2,000 Coins or reach 5,000m in a single run.
- **Gameplay Perk:** *Overdrive Pacing* — Base speed ramp-up starts +10% higher with +15% coin score value.
- **Polygon Count:** 1,420 triangles.

---

#### 5. Ren Tanaka ("Glitch")
- **Role & Archetype:** Sub-Grid Courier / Tech Runner.
- **Ethnicity & Background:** Non-binary / Japanese heritage. High-speed encrypted data runner.
- **Visual Design:** Asymmetrical lavender undercut; matte black high-collar techwear jacket with glowing cyan electroluminescent piping (#06B6D4); weatherproof tapered flight pants; low-poly cybernetic right forearm with status LEDs; compact data deck backpack.
- **Animations:** Low-center-of-gravity stride; cybernetic-assisted one-arm vaulting; glitch-trail particle bursts on lane changes.
- **Unlock Condition:** Reach 5,000m total lifetime distance.
- **Gameplay Perk:** *EMP Pulse* — Power-up durations (Magnet, 2X, Shield) extended by +3 seconds.
- **Polygon Count:** 1,680 triangles.

---

#### 6. Elena Rostova ("Peak")
- **Role & Archetype:** Wilderness Recon / Alpine Explorer.
- **Ethnicity & Background:** Slavic heritage. Mountain search-and-rescue specialist.
- **Visual Design:** Loose blonde braid beneath an olive-drab knit beanie; down-quilted cobalt alpine vest (#2563EB) over slate thermal base; ripstop climbing trousers with knee articulators; vibram-sole hiking boots; climbing harness with low-poly carabiners.
- **Animations:** Grounded, sure-footed power stride; ice-axe slide assist; aggressive forward hurdle clearance.
- **Unlock Condition:** 3,500 Coins or reach 8,000m in a single run.
- **Gameplay Perk:** *Sure Grip* — Completely unaffected by snowy village ice patches and desert wind drifts.
- **Polygon Count:** 1,590 triangles.

---

#### 7. Tariq Al-Mansoor ("Sirocco")
- **Role & Archetype:** Dune Navigator / Desert Sand-Runner.
- **Ethnicity & Background:** Middle Eastern heritage. Raised on desert dunes.
- **Visual Design:** Billowing sand-ochre desert cowl/keffiyeh wrap (#D97706); breathable linen runner tunic with leather cross-chest bandolier; tapered cargo pants tucked into sand-trap gaiters; tinted brass sand goggles on brow.
- **Animations:** Low, sweeping stride that mimics sand-surfing; broad flowing-cape jump arcs; sand-drift slide.
- **Unlock Condition:** Reach 12,000m total lifetime distance.
- **Gameplay Perk:** *Desert Wind* — Generates +25% bonus score while maintaining top speed tier.
- **Polygon Count:** 1,520 triangles.

---

#### 8. Jax Miller ("Anvil")
- **Role & Archetype:** Industrial Heavyweight / Scrapper.
- **Ethnicity & Background:** Multiracial / Oceanic heritage. Heavy industrial dockworker.
- **Visual Design:** Close-cropped fade; heavy sleeveless work vest (#F97316); rivet-reinforced duck canvas work overalls tied at the waist; steel-toed boots with neon tread; welding goggles on forehead; spanner tool belt.
- **Animations:** Heavy, ground-shaking powerhouse stride; shoulder-forward hurdle smash; power crouch slide.
- **Unlock Condition:** 6,000 Coins.
- **Gameplay Perk:** *Juggernaut* — The first obstacle stumble in any run does NOT reduce chase distance.
- **Polygon Count:** 1,640 triangles.

---

#### 9. Zoe Chen ("Roller")
- **Role & Archetype:** Urban Rollerblade Specialist / Neon Cruiser.
- **Ethnicity & Background:** Asian American. Speed courier on wheels.
- **Visual Design:** Space buns with hot-pink tips; cropped teal and neon magenta retro windbreaker (#EC4899 / #14B8A6); skater shorts; four-wheel low-poly inline speed skates with glowing polyurethane wheels; aerodynamic skate helmet and knee pads.
- **Animations:** Smooth side-to-side roller-skate pump glide; aerial 360 spin during jumps; low powerslide.
- **Unlock Condition:** Reach 20,000m total lifetime distance.
- **Gameplay Perk:** *Momentum Glide* — Lane switches are 30% faster and maintain smoother velocity.
- **Polygon Count:** 1,720 triangles.

---

#### 10. Nova-09 ("Apex")
- **Role & Archetype:** Autonomous Kinetic Unit / Synthetic Prototype.
- **Ethnicity & Background:** Advanced AI synthetic android.
- **Visual Design:** Chiseled matte-white composite chassis (#F8FAFC) with prism-refracting internal core; segmented kinetic leg pistons; magnetic frictionless contact pads with blue ion exhaust glow; animated holographic visor face.
- **Animations:** Ultra-precise robotic strides; micro-thruster hover jump; frictionless magnetic deck slide.
- **Unlock Condition:** 10,000 Coins or reach 35,000m total lifetime distance.
- **Gameplay Perk:** *Quantum Magnetism* — Inherent permanent 1.5m coin magnet aura that stacks with pickups.
- **Polygon Count:** 1,790 triangles.
`,
  },
  {
    id: 'environments-biomes',
    title: '5. The 7 Distinct Biomes & Obstacle Architecture',
    subtitle: 'Lighting, Shaders, Low-Poly Props & Thematic Obstacle Kits',
    contentMarkdown: `
### 5.1 Biome Design System
Each of the **seven biomes** has a completely unique set of modular 3D track chunks, obstacle hazards, ambient lighting, particle weather, and musical identity. The track dynamically transitions between biomes as the run progresses (every 1,000–1,500m) or can be selected in Custom Run mode.

---

### 5.2 Deep-Dive Specifications per Biome

#### Biome 1: Modern Neon City (Tier-1 Night Metropolis)
- **Visuals & Lighting:** Wet asphalt road with sharp mirror-like reflections; deep navy/charcoal sky (#090D16); vibrant cyan and magenta holographic billboard glows; warm streetlight pools.
- **Key Props:** Low-poly yellow cabs, fire hydrants, multi-story skyscraper facades with glowing window grids, neon noodle shop signs, overhead highway gantries.
- **Obstacle Kit:**
  - *Hurdle (Jump):* Striped concrete police barricade with flashing amber beacons.
  - *Overhead (Slide):* Swaying low-hanging electrical cable and neon billboard gantry.
  - *Full-Lane (Switch):* Stalled yellow taxicab or police cruiser.
  - *Dynamic:* Steaming open maintenance manhole with hazard cones.
- **Audio & Mood:** High-tempo French electro & synthwave runner (128 BPM) with punchy 808 kicks, arpeggiated analog synth bass, and distant police siren echoes.

---

#### Biome 2: Hot Desert Canyon (Red Rock Mesas)
- **Visuals & Lighting:** Blistering high-noon sun; rich terracotta and ochre sandstone (#B45309); heat-haze mirage particle distortion; distant multi-tiered red mesas against a warm peach sky (#FDBA74).
- **Key Props:** Flowering saguaro cacti, bleached animal skulls, tumbled sandstone boulders, abandoned gold mining rail carts, drifting tumbleweeds.
- **Obstacle Kit:**
  - *Hurdle (Jump):* Prickly saguaro cactus cluster or cracked canyon fissure gap.
  - *Overhead (Slide):* Natural low-hanging red sandstone archway.
  - *Full-Lane (Switch):* Giant fallen red granite boulder blocking the track.
  - *Dynamic:* Rickety wooden mining trestle missing middle planks.
- **Audio & Mood:** Driving desert rock with overdriven slide guitar, stomping acoustic kick, rattlesnake shakers, and canyon wind whistles (124 BPM).

---

#### Biome 3: Dense Primeval Forest (Ancient Canopy)
- **Visuals & Lighting:** Rich moss-green damp earth (#14532D); dappled god-ray light filtering through ancient cedar canopies; soft emerald ground fog (#064E3B).
- **Key Props:** Towering sequoia and pine trees, mossy riverbanks, wooden footbridges, luminous bioluminescent forest mushrooms, fern thickets.
- **Obstacle Kit:**
  - *Overhead (Slide):* Massive hollowed-out fallen cedar trunk (player slides directly through the hollow cylinder).
  - *Hurdle (Jump):* Exposed gnarled redwood roots or a babbling river log crossing.
  - *Full-Lane (Switch):* Giant mossy standing sequoia base.
  - *Dynamic:* Falling pine cone hazard zone marked by shadow rings.
- **Audio & Mood:** Organic tribal drum-and-bass with polyrhythmic congas, resonant wooden flute hooks, and canopy birdsong (126 BPM).

---

#### Biome 4: Cliff & Mountain Ridge (High-Altitude Precipice)
- **Visuals & Lighting:** Perilous narrow ridge path flanked by sheer drop-offs with no guard rails; crisp alpine dawn sky (#BAE6FD); cool slate-gray rock (#334155); whistling high-altitude wind trails.
- **Key Props:** Jagged basalt spires, swaying rope suspension bridges, whipping weather flags, soaring eagles in the distant valley depth.
- **Obstacle Kit:**
  - *Hurdle (Jump):* Sheer chasm gap between rock pillars (miss = fall into abyss).
  - *Overhead (Slide):* Low craggy basalt overhang.
  - *Full-Lane (Switch):* Vertical needle-rock spire rising straight through the path.
  - *Dynamic:* Rockfall warning zones with tumbling pebbles.
- **Audio & Mood:** Dramatic cinematic hybrid orchestral with pounding taiko drums, rapid staccato violins, and roaring mountain wind soundscapes (130 BPM).

---

#### Biome 5: Snowy Alpine Village (Winter Twilight)
- **Visuals & Lighting:** Deep twilight blue sky (#1E1B4B); snow-covered chalet gables (#F1F5F9); glowing golden holiday fairy lights wrapped around pine posts; gentle drifting low-poly snowflake particles.
- **Key Props:** Rustic timber log chalets with smoking chimneys, snow-covered fir trees, wooden toboggans, wrought-iron lampposts casting warm halos, festive holiday wreaths.
- **Obstacle Kit:**
  - *Hurdle (Jump):* Snow-covered timber sled or frozen town square well.
  - *Overhead (Slide):* Low festive pine garlands and glowing holiday lanterns strung across the street.
  - *Full-Lane (Switch):* Deep unplowed snowbank drift.
  - *Dynamic:* Slick frozen ice patch (temporarily increases lane switch speed by 50%).
- **Audio & Mood:** Warm festive lo-fi winter beats with glockenspiel chimes, upright bass, Rhodes piano, and satisfying snow-crunch footsteps (120 BPM).

---

#### Biome 6: Industrial Rainstorm (Midnight Squall)
- **Visuals & Lighting:** Pitch-black midnight sky (#030712); heavy vertical rain streaks; flooded puddles with ripple rings; dramatic periodic whole-screen lightning sheet flashes illuminating the silhouette of cranes.
- **Key Props:** Towering container cranes, stacked corrugated shipping crates, high-pressure steam exhaust stacks, yellow caution gantries, storm drain torrents.
- **Obstacle Kit:**
  - *Overhead (Slide):* Burst high-pressure steam pipe venting scalding white plumes across the lane.
  - *Hurdle (Jump):* Low steel shipping crate fallen from a gantry or severed electrified power cable.
  - *Full-Lane (Switch):* Flooded generator forklift stalled in the lane.
  - *Dynamic:* Sweeping floodlight beams from automated security towers.
- **Audio & Mood:** Dark pounding industrial techno (134 BPM) with distorted 909 kicks, resonant acid bass synth, metallic clangs, and deep rolling thunder booms.

---

#### Biome 7: Futuristic Neo-City (Skyways & Holograms)
- **Visuals & Lighting:** Deep cosmic violet sky (#05051A); floating crystalline skyways; glowing neon-cyan lane boundaries (#06B6D4); streams of flying hovercars above and below; pulsing holographic advertisements.
- **Key Props:** Anti-gravity mag-lev track rings, holographic speed boost pylons, hovering police patrol drones, crystalline arcology spires.
- **Obstacle Kit:**
  - *Overhead (Slide):* High-energy crimson security laser grid.
  - *Hurdle (Jump):* Pulsing force-field tripwire or missing de-energized quantum road tile.
  - *Full-Lane (Switch):* Hovering police scan drone maintaining lane lock.
  - *Dynamic:* Moving holographic decoy barrier that blinks in and out.
- **Audio & Mood:** High-energy glitch hop and cyberpunk drum-and-bass (140 BPM) with Reese bass, syncopated breakbeats, laser sweeps, and futuristic UI chimes.
`,
  },
  {
    id: 'progression-monetization',
    title: '6. Progression, Upgrades & Fair Non-P2W Monetization',
    subtitle: 'Economy Loops, Power-Up Upgrade Trees & Ethical Revenue Strategy',
    contentMarkdown: `
### 6.1 Economy Loop Overview
**Urban Dash 3D** adopts a strictly **ethical, non-pay-to-win** design philosophy. All ten characters and all power-up upgrades are unlockable exclusively via gameplay coins and lifetime distance milestones. 

\`\`\`
   ┌─────────────────────────────────────────────────────────────┐
   │                        GAMEPLAY RUN                         │
   │  • Collect in-run Coins (standard 1x or 2x with Multiplier) │
   │  • Accumulate Lifetime Distance Milestones                  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                      THE RUNNER SHOP                        │
   │  1. Permanent Power-Up Upgrade Tree (Tier I -> Tier V)     │
   │  2. Character Roster Unlocks (Coins or Distance Milestones) │
   │  3. Purely Cosmetic Customization (Skins, Trail Effects)    │
   └─────────────────────────────────────────────────────────────┘
\`\`\`

---

### 6.2 Power-Up Upgrade Matrix (Coins Sinks)

| Power-Up | Base Effect | Upgrade Tier I (500 C) | Upgrade Tier II (1,500 C) | Upgrade Tier III (3,500 C) | Upgrade Tier IV (7,000 C) | Upgrade Tier V (12,000 C) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Coin Magnet** | Pulls coins in 3.5m radius for 10s | Duration 12s | Radius 5.0m | Duration 15s | Radius 7.0m | Duration 20s + pulls across all 3 lanes |
| **Super Sneakers** | Increases jump height + hang time for 10s | Duration 12s | Jump height +15% | Duration 15s | Auto-clears high obstacles | Duration 20s + double-jump ability |
| **2X Multiplier** | Doubles score multiplier for 10s | Duration 12s | 3X Multiplier burst | Duration 15s | 4X Multiplier burst | Duration 20s + triples coin count |
| **Energy Shield** | Absorbs 1 fatal obstacle hit | Invulnerability +1s | Shield duration 15s | Respawns safely +2s | Repels pursuers +15m | 2-Hit Shield capacity |

---

### 6.3 Fair Monetization Guidelines (Android)
- **Zero Energy / Timer Gating:** Players can run as many times as they want without "lives", "fuel", or artificial cool-downs.
- **Opt-In Rewarded Video Ads Only:**
  - *One Free Revive per Run:* Optional 15-30s rewarded video to continue once per run with a 3-second invulnerability burst and 50 units of chase distance.
  - *End-of-Run Coin Doubler:* Optional rewarded video to double earned coins from that run.
  - *Daily Mystery Box:* 1 free box per day; optional ad for a bonus spin.
- **Premium IAP Options (Zero P2W):**
  - *Permanent Ad-Removal Pack ($2.99):* Eliminates banner ads and grants free instant revives (capped at 1 per run) without watching ads.
  - *Cosmetic Founder Pack ($4.99):* Exclusive golden sneaker trail effect, neon police siren vehicle skin, and 10,000 instant bonus coins.
  - *Character Skin Variants ($0.99 - $1.99):* Purely visual colorways and headwear variants (e.g. Malik's Gold Champion Tracksuit).
`,
  },
  {
    id: 'android-technical-guide',
    title: '7. Android Technical Architecture & Optimization Guide',
    subtitle: 'Unity / Godot Engine Blueprints, Draw Call Budgets, Object Pooling & Shaders',
    contentMarkdown: `
### 7.1 Performance Budgets for Mid-Range Android
To hit a stable **60 FPS** on devices like the Samsung Galaxy A14, Xiaomi Redmi Note 12, or Motorola Moto G, the engine must respect these hard budgets:

- **Triangle Count:** $\\le 15,000$ triangles per frame visible on screen.
- **Draw Calls:** $\\le 35$ draw calls per frame via static/dynamic batching and texture atlasing.
- **Shader Complexity:** Vertex-lit flat shading or unlit shaders with single-pass directional lighting. No dynamic shadow cascades; soft baked contact-shadow blob discs underneath player and pursuers.
- **Texture Memory:** Max 2 texture atlases ($1024 \\times 1024$ ASTC 6x6 format) covering all characters, environment props, and UI icons.

---

### 7.2 Zero-Allocation Object Pooling Architecture
Garbage collection spikes cause frame drops on Android. All track chunks, obstacles, coins, and pursuers MUST use pre-allocated pools initialized during the boot splash screen.

\`\`\`csharp
// Example Unity C# Zero-GC Track Pool Pattern
public class TrackPoolManager : MonoBehaviour {
    [SerializeField] private GameObject[] trackChunkPrefabs;
    private readonly Queue<GameObject> activeChunks = new Queue<GameObject>();
    private readonly List<GameObject> pooledChunks = new List<GameObject>();
    private float nextSpawnZ = 0f;
    private const int INITIAL_POOL_SIZE = 12;
    private const float CHUNK_LENGTH = 30f;

    void Awake() {
        for (int i = 0; i < INITIAL_POOL_SIZE; i++) {
            GameObject chunk = Instantiate(trackChunkPrefabs[i % trackChunkPrefabs.Length]);
            chunk.SetActive(false);
            pooledChunks.Add(chunk);
        }
    }

    public void SpawnNextChunk() {
        GameObject chunk = GetAvailablePooledChunk();
        chunk.transform.position = new Vector3(0, 0, nextSpawnZ);
        chunk.SetActive(true);
        activeChunks.Enqueue(chunk);
        nextSpawnZ += CHUNK_LENGTH;
    }

    public void RecycleOldestChunk() {
        GameObject oldChunk = activeChunks.Dequeue();
        oldChunk.SetActive(false);
    }
}
\`\`\`

---

### 7.3 Android Input Latency & Touch Calibration
- **120Hz Touch Polling:** Enable Android High-Refresh Touch Mode (\`Input.simulateMouseWithTouches = false\`).
- **Swipe Recognition Deadzones:**
  - Minimum swipe distance: $40\\text{ pixels}$ (prevents accidental inputs from finger rest).
  - Angle snapping: $\\pm 35^\\circ$ cone for Left/Right/Up/Down axes to cleanly separate lane switches from jumps.
  - Maximum gesture duration: $250\\text{ms}$ (slow drags are discarded).
- **Haptic Feedback:** Native Android vibration ticks (\`Vibrator.vibrate(VibrationEffect.createPredefined(CLICK))\`) on successful lane switch and obstacle stumble.

---

### 7.4 Shader & Asset Pipeline Recommendations
1. **Universal Render Pipeline (URP) Settings in Unity:**
   - Rendering Path: *Forward+*
   - Color Space: *Linear*
   - HDR: *Disabled* (unnecessary for low-poly flat-shaded art, saves memory bandwidth).
   - Anti-Aliasing: *2x MSAA* (smooths low-poly geometric edges on high-DPI phone displays).
2. **Texture Atlasing:**
   - Pack all low-poly character vertex palette colors into a single $256 \\times 256$ texture map.
   - All meshes map their UV coordinates to discrete color pixel zones on this palette.
   - Allows all 10 characters, Officer Higgins, Buster the Dog, and all obstacles to be rendered in **a single draw call per material**.
`,
  },
];
