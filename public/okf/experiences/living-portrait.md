---
type: 3D Experience
title: The Living Portrait
description: The homepage portrait assembles from 65,536 mosaic tiles, wears a pulsing neural net, and shatters and heals on click.
resource: https://venkatapagadala.com
tags: [particles, shaders, portrait]
generated: { by: claude-code/fable-5, at: 2026-07-30T05:30:00Z }
verified: { by: claude-code/fable-5, at: 2026-08-04T11:30:00Z }
---
# How it is built

One draw call of 65,536 points, each carrying one pixel of the photograph.
Tiles assemble bottom-up; a crisp photo crossfades in at rest; luminance
depth makes pointer tilt parallax like a 3D render; a click fires a radium
chain ring through tiles, edges and neurons while the image shatters and
heals.
