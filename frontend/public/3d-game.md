# 3D Game: Drive and Walk a Year-2040 City

Canonical: https://venkatapagadala.com/3d-game
Author: Venkata Pagadala
Type: Interactive, browser-native, no download

A playable 2040 city that runs entirely in the browser. Walk a humanoid, greet
the crew, and take the controls of any truck, robotaxi, semi or cargo barge.
Nothing is downloaded: every robot, vehicle, tower and barge is generated
geometry, so the whole city ships as code.

## Controls

- Arrows or WASD: walk the humanoid
- Shift: run
- E: greet the nearest unit, and it waves back
- Click a machine: take the controls of any vehicle or barge
- Wheel, R N D, pedals: steer, select gear, accelerate and brake
- Esc: leave the machine and hand it back to the city

## What is running under it

Every machine follows an arc-length curve, so traffic keeps its spacing
indefinitely instead of drifting into a pile-up over a long session.

Collision uses oriented capsules rather than circles. A car is not round, and a
circle sized to a vehicle's length sweeps a radius far wider than the body, so
bodies resolved against phantom overlaps and passed through real ones. Each
body is a spine swept by a radius, and it turns with the car.

Traffic is level aware. The elevated viaduct peaks well above grade, so without
a level test a truck on the viaduct would shove a car on the road below it.
Each machine refreshes which deck it is on from its real height every frame, so
one coming down a ramp rejoins ground traffic on the same frame.

The chassis runs on a fixed timestep with substepping and a capped delta,
because a variable frame spike used to teleport a driven machine through
whatever was in front of it.

The cockpit is a Formula-style rim with a live rev strip, a speed and gear
display, and four working controls: forward, reverse, a booster with a finite
charge that depletes and recharges, and an autopilot that hands the machine
back to the same lane-following system that drives the ambient traffic, while
you stay aboard and the camera keeps following.

The construction crew is coupled to its work: the kneeling pair's hands track
the beam's real height each frame, a carrier hauls panels, a welder throws
sparks.

## Frequently asked

**Do I need to download or install anything?**
No. It runs in any browser with WebGL. There are no asset files.

**How is a browser 3D city built without downloading 3D models?**
Every object is procedural geometry composed at runtime from primitives and
extruded profiles with three.js. Vehicles are built from extruded side profiles
with separately shaped cabins and wheel arches, humanoids from a jointed rig
driven by pose functions, and traffic follows arc-length curves.

**Does it work on a phone?**
Yes. The controls reflow to a compact layout on narrow screens and coarse
pointers.
