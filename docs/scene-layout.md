# Forest Hospital scene layout

`src/scene.js` exports `buildHospital(THREE)`, returning `{ group, departments, walkers, update(t, dt), dispose() }`.

## Coordinate plan

Three.js uses Y-up. The hero camera faces from `[7,16,39]` toward `[0,7,0]`; all clinic openings and their interior hardware face +Z. The mature trunk is centered near `[0,8,-4.3]`, with branch and canopy geometry behind and above the room plane. An oval forest island occupies the lower center.

| Department | ID | Center | Main recognizable props |
|---|---|---:|---|
| 内存科 | `memory` | `[-8.25,7,1.1]` | Three RAM-patient beds with PCB headboards and gold contacts |
| CPU 科 | `cpu` | `[0,8.05,-1]` | Large smiling processor patient on a service plinth, pin rows, diagnostic screen |
| 温度科 | `temperature` | `[8.25,7,1.1]` | Blue ice bed, ice blocks and an animated cooling fan |
| 桌面科 | `desktop` | `[-8.25,1.15,1.75]` | Live desktop display, keyboard/workbench, labeled storage files |
| 磁盘科 | `disk` | `[0,1.2,1.5]` | Two shelves of drive patients with indicator lights and service bench |
| 网络科 | `network` | `[8.25,1.15,1.75]` | Two network racks, switch/router table, status LEDs and colored cables |

The central reception counter sits in front of the trunk at `[0,.15,5.2]`. Timber platforms, rope rails, lanterns, slatted bridges, stairs, potted plants, moss and stones tie the six rooms into one treehouse. Room ribs and roofs frame the rooms without closing their +Z faces.

## Picking and updates

Each department entry has `id`, `name`, `group`, `hitMeshes`, `anchor` and `accent`. A transparent room volume is available in `hitMeshes`; it carries `userData.departmentId` and is invisible for rendering. Major visible room geometry may also be added to `hitMeshes`. Root code may raycast recursively through each `group` and use the same `departmentId` metadata. Anchors are room-local and project above the front edge for UI labels.

`walkers` provides nine route polylines for doctor/visitor actors. Each `points` array is in world coordinates and follows a room platform, bridge or reception deck. Characters are intentionally provided by the separate character module. `update` advances the temperature room's fan.

All meshes use shared procedural geometry/material caches, with no external images, models, or network textures. Canvas-generated wood plaque labels are the only texture use.
