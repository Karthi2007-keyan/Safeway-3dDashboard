const fs = require('fs');
const gltf = JSON.parse(fs.readFileSync('public/models/road_terrain/scene.gltf', 'utf8'));
const bin = fs.readFileSync('public/models/road_terrain/scene.bin');

const posAcc = gltf.accessors[0];
const uvAcc = gltf.accessors[2];
const posBv = gltf.bufferViews[posAcc.bufferView];
const uvBv = gltf.bufferViews[uvAcc.bufferView];
const posOffset = (posBv.byteOffset || 0) + (posAcc.byteOffset || 0);
const uvOffset = (uvBv.byteOffset || 0) + (uvAcc.byteOffset || 0);

const indAcc = gltf.accessors[gltf.meshes[0].primitives[0].indices];
const indBv = gltf.bufferViews[indAcc.bufferView];
const indOffset = (indBv.byteOffset || 0) + (indAcc.byteOffset || 0);
const isUint32 = indAcc.componentType === 5125;
const readIndex = (i) => isUint32 ? bin.readUInt32LE(indOffset + i * 4) : bin.readUInt16LE(indOffset + i * 2);

// Check triangles and find where road/track path is
console.log('Sampling low elevation road sections...');
for (let y = -3500; y <= 3500; y += 500) {
  const pts = [];
  for (let i = 0; i < posAcc.count; i++) {
    const px = bin.readFloatLE(posOffset + i * 12);
    const py = bin.readFloatLE(posOffset + i * 12 + 4);
    const pz = bin.readFloatLE(posOffset + i * 12 + 8);
    if (Math.abs(py - y) < 250 && pz < 260) {
      pts.push({ px, py, pz });
    }
  }
  if (pts.length > 0) {
    const minX = Math.min(...pts.map(p => p.px));
    const maxX = Math.max(...pts.map(p => p.px));
    const avgZ = pts.reduce((s, p) => s + p.pz, 0) / pts.length;
    console.log(`Y ≈ ${y.toString().padStart(5)}: X span [${minX.toFixed(0)} to ${maxX.toFixed(0)}], width = ${(maxX - minX).toFixed(0)}, avgZ = ${avgZ.toFixed(1)}, pts = ${pts.length}`);
  }
}
