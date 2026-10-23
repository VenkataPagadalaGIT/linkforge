---
type: 3D Experience
title: 3D Game, the 2040 City
description: A playable 2040 city in the browser. Walk a humanoid, greet the crew, drive any truck, robotaxi, semi or barge from a formula-style cockpit.
resource: https://venkatapagadala.com/3d-game
tags: [game, procedural, webgl]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-04T11:30:00Z }
---
# How it is built

Every robot, vehicle, tower and barge is procedural geometry composed at
runtime. Traffic follows arc-length curves so spacing holds over long
sessions; collision uses oriented capsules; the cockpit wheel has forward,
reverse, booster and autopilot.
