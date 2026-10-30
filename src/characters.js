// Editable, lightweight chibi people for the forest hospital scene.
// Coordinates: feet at y=0, face toward local +Z. All animation reuses objects.
const sharedByThree = new WeakMap();

export function createCharacter(THREE, { role = 'doctor', color = '#5e9b84', scale = 1, seed = 1 } = {}) {
  let shared = sharedByThree.get(THREE);
  if (!shared) {
    shared = { geometry: new Map(), material: new Map() };
    sharedByThree.set(THREE, shared);
  }
  const getGeometry = (key, make) => {
    if (!shared.geometry.has(key)) shared.geometry.set(key, make());
    return shared.geometry.get(key);
  };
  const canonicalColor = (value) => `#${new THREE.Color(value).getHexString()}`;
  const sharedMaterial = (c, roughness = 0.82) => {
    const colorHex = canonicalColor(c), key = `${colorHex}/${roughness}`;
    if (!shared.material.has(key)) shared.material.set(key, new THREE.MeshStandardMaterial({ color: colorHex, roughness }));
    return shared.material.get(key);
  };
  const group = new THREE.Group();
  group.name = `character-${role}`;
  const mat = sharedMaterial;
  const skin = mat('#f3c49c'), blush = mat('#e99d91'), hair = mat(role === 'doctor' ? '#49332c' : '#6d4431');
  const coat = mat(role === 'doctor' ? '#fffaf0' : color), coatShade = mat(role === 'doctor' ? '#dce8df' : '#d7c8b3');
  const trim = mat(color), dark = mat('#3d3637'), eyeMat = mat('#30252a', .48), white = mat('#ffffff'), gold = mat('#d99a43');
  const geo = {
    sphere: getGeometry('sphere:20:14', () => new THREE.SphereGeometry(1, 20, 14)),
    smallSphere: getGeometry('sphere:12:9', () => new THREE.SphereGeometry(1, 12, 9)),
    capsule: getGeometry('capsule:.1:.22:4:8', () => new THREE.CapsuleGeometry(.1, .22, 4, 8)),
    cylinder: getGeometry('cylinder:.5:.5:1:12', () => new THREE.CylinderGeometry(.5, .5, 1, 12)),
    box: getGeometry('box:1:1:1', () => new THREE.BoxGeometry(1, 1, 1)),
    torus: getGeometry('torus:.12:.025:6:12', () => new THREE.TorusGeometry(.12, .025, 6, 12))
  };
  const part = (parent, geometry, material, name, pos, scl, rot) => {
    const m = new THREE.Mesh(geometry, material); m.name = name; m.position.set(...pos); m.scale.set(...scl);
    if (rot) m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (parent, material, name, pos, scl, g = geo.sphere) => part(parent, g, material, name, pos, scl);
  // Legs are separate pivot groups, with shoes at their lower ends.
  const legs = [];
  for (const [i, x] of [-.17, .17].entries()) {
    const pivot = new THREE.Group(); pivot.position.set(x, .43, 0); group.add(pivot); legs.push(pivot);
    part(pivot, geo.capsule, role === 'doctor' ? dark : trim, `leg-${i}`, [0, -.19, 0], [.72, 1.05, .72]);
    ball(pivot, role === 'doctor' ? dark : trim, `shoe-${i}`, [0, -.37, .075], [.115, .075, .17], geo.smallSphere);
  }
  // Rounded coat torso and collar.
  const torso = new THREE.Group(); torso.position.y = .7; group.add(torso);
  ball(torso, coat, 'rounded-coat', [0, .04, 0], [.34, .43, .25]);
  ball(torso, coatShade, 'coat-side-panel', [-.21, .015, .015], [.09, .34, .205], geo.smallSphere);
  ball(torso, coatShade, 'coat-side-panel', [.21, .015, .015], [.09, .34, .205], geo.smallSphere);
  // Coat opening, small buttons, pocket and stethoscope details.
  part(torso, geo.box, coatShade, 'coat-placket', [0, .02, .241], [.035, .48, .018]);
  for (let i = 0; i < 3; i++) ball(torso, gold, `coat-button-${i}`, [.035, .19 - i * .12, .259], [.022, .022, .012], geo.smallSphere);
  part(torso, geo.box, coatShade, 'coat-pocket', [-.19, -.02, .226], [.13, .13, .028]);
  if (role === 'doctor') {
    // Stethoscope tubing follows the chest as two fine visible tubes.
    const tubeMat = mat('#72a496', .55);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.12, .26, .255), new THREE.Vector3(-.16, .11, .274), new THREE.Vector3(-.12, -.08, .27),
      new THREE.Vector3(-.04, -.16, .273), new THREE.Vector3(.03, -.11, .277)
    ]);
    const tubeGeometry = getGeometry('stethoscope-tube', () => new THREE.TubeGeometry(curve, 18, .018, 6, false));
    const tube = new THREE.Mesh(tubeGeometry, tubeMat); tube.name = 'stethoscope'; torso.add(tube);
    ball(torso, gold, 'stethoscope-chestpiece', [.04, -.105, .29], [.045, .045, .022], geo.smallSphere);
  }
  // Arm pivots at shoulders, tapered sleeves, cuffs and mitten-like hands.
  const arms = [];
  for (const [i, side] of [-1, 1].entries()) {
    const pivot = new THREE.Group(); pivot.position.set(side * .29, .27, 0); torso.add(pivot); arms.push(pivot);
    const sleeve = ball(pivot, coat, `sleeve-${i}`, [side * .035, -.17, 0], [.125, .23, .13], geo.smallSphere);
    sleeve.rotation.z = -side * .12;
    ball(pivot, coatShade, `cuff-${i}`, [side * .055, -.315, .012], [.12, .065, .125], geo.smallSphere);
    ball(pivot, skin, `hand-${i}`, [side * .07, -.39, .045], [.105, .105, .095], geo.smallSphere);
  }
  // Head on a small pivot: cheeks, ears, big readable eyes, brows and curved smile.
  const headPivot = new THREE.Group(); headPivot.position.set(0, 1.23, 0); group.add(headPivot);
  ball(headPivot, skin, 'large-head', [0, .05, 0], [.39, .39, .34]);
  const eyes = [];
  for (const s of [-1, 1]) {
    ball(headPivot, skin, 'ear', [s * .37, .02, -.005], [.085, .12, .08], geo.smallSphere);
    ball(headPivot, blush, 'cheek', [s * .22, -.065, .287], [.09, .047, .022], geo.smallSphere);
    eyes.push(ball(headPivot, eyeMat, 'eye', [s * .135, .075, .309], [.043, .063, .03], geo.smallSphere));
    ball(headPivot, white, 'eye-glint', [s * .135 - .012, .097, .334], [.012, .016, .008], geo.smallSphere);
    const brow = ball(headPivot, hair, 'eyebrow', [s * .135, .166, .304], [.052, .018, .016], geo.smallSphere); brow.rotation.z = -s * .08;
  }
  // Smile as a shallow curved tube; reads as a friendly upturned mouth.
  const smileCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.075, -.105, .321), new THREE.Vector3(0, -.17, .35), new THREE.Vector3(.075, -.105, .321));
  const smileGeometry = getGeometry('smile-tube', () => new THREE.TubeGeometry(smileCurve, 12, .012, 5, false));
  const smile = new THREE.Mesh(smileGeometry, dark); smile.name = 'smile'; headPivot.add(smile);
  // Soft fringe/cap or visitor hairstyle.
  if (role === 'doctor') {
    ball(headPivot, hair, 'hair-back', [0, .27, -.1], [.31, .22, .27]);
    ball(headPivot, white, 'nurse-cap', [0, .36, .005], [.31, .12, .27]);
    ball(headPivot, white, 'cap-brim', [0, .29, .18], [.33, .06, .17], geo.smallSphere);
    const cross = mat('#5e9b84');
    part(headPivot, geo.box, cross, 'cap-plus-vertical', [0, .37, .242], [.055, .17, .025]);
    part(headPivot, geo.box, cross, 'cap-plus-horizontal', [0, .37, .244], [.16, .055, .026]);
    // Clipboard held near the torso by the left hand.
    const board = new THREE.Group(); board.name = 'clipboard'; board.position.set(-.32, -.25, .12); board.rotation.z = .13; torso.add(board);
    part(board, geo.box, mat('#b88350'), 'clipboard-board', [0, 0, 0], [.22, .3, .045]);
    part(board, geo.box, white, 'clipboard-paper', [0, .008, .027], [.17, .23, .012]);
    part(board, geo.box, trim, 'clipboard-clip', [0, .125, .04], [.07, .025, .014]);
  } else {
    ball(headPivot, hair, 'hair-cap', [0, .26, -.055], [.35, .23, .31]);
    ball(headPivot, hair, 'hair-fringe', [0, .205, .245], [.26, .11, .12], geo.smallSphere);
    // Backpack, visible behind one shoulder.
    const pack = new THREE.Group(); pack.name = 'backpack'; pack.position.set(0, .8, -.21); group.add(pack);
    ball(pack, trim, 'backpack-body', [0, 0, 0], [.23, .29, .14]);
    ball(pack, coatShade, 'backpack-pocket', [0, -.055, .125], [.15, .12, .035], geo.smallSphere);
  }
  // Slightly oversized, stable stance feet and rounded coat hem.
  ball(torso, coat, 'coat-hem', [0, -.29, 0], [.34, .17, .25]);
  group.scale.setScalar(scale);
  group.userData.characterRole = role;
  group.userData.characterSeed = seed;

  const phase = (Number(seed) || 1) * 2.399963229728653;
  const blinkPhase = ((Math.abs(Number(seed) || 1) * .61803398875) % 1) * 4.7;
  let blink = 1;
  function update(t, dt, { speed = 0, walking = false } = {}) {
    const time = Number(t) || 0;
    const gait = walking ? Math.min(1, Math.abs(speed) || .7) : 0;
    const cycle = time * (walking ? 8.2 : 1.7) + phase;
    const swing = Math.sin(cycle) * gait;
    legs[0].rotation.x = swing * .48; legs[1].rotation.x = -swing * .48;
    arms[0].rotation.x = -swing * .37 - .04; arms[1].rotation.x = swing * .37 + .025;
    arms[0].rotation.z = .08; arms[1].rotation.z = -.08;
    const bob = Math.abs(Math.sin(cycle * 2)) * .025 * (walking ? 1 : .25);
    torso.position.y = .7 + bob;
    headPivot.position.y = 1.23 + bob;
    torso.scale.y = 1 + Math.sin(time * 2.2 + phase) * .012;
    headPivot.rotation.z = Math.sin(time * .8 + phase) * .025;
    // Blink is a small deterministic pulse; scale only existing eye meshes.
    const blinkCycle = (time + blinkPhase) % 4.4;
    blink = (blinkCycle > 3.98 && blinkCycle < 4.12) ? .12 + .88 * Math.abs((blinkCycle - 4.05) / .07) : 1;
    for (const eye of eyes) eye.scale.y = .063 * blink;
  }
  return { group, update };
}

export default createCharacter;
