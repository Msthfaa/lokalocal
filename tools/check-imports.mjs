import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('web/src');
console.log('Scanning files:', files.length);

const threeClasses = [
  'Vector3', 'Vector2', 'Euler', 'Quaternion', 'Matrix4', 'Object3D',
  'EdgesGeometry', 'LineBasicMaterial', 'LineSegments', 'Group',
  'MeshStandardMaterial', 'Color', 'Mesh', 'CanvasTexture',
  'SRGBColorSpace', 'LinearFilter', 'RepeatWrapping', 'AmbientLight',
  'DirectionalLight', 'HemisphereLight', 'PointLight', 'Raycaster',
  'PerspectiveCamera', 'Scene', 'WebGLRenderer', 'Box3', 'Shape',
  'ExtrudeGeometry', 'PlaneGeometry', 'BufferGeometry',
  'Float32BufferAttribute', 'DoubleSide', 'FrontSide', 'BackSide',
  'LineDashedMaterial', 'Line', 'MeshBasicMaterial',
  'WebGLRenderTarget', 'OrthographicCamera', 'ShaderMaterial'
];

let foundErrors = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes("from 'three'")) {
    const importMatch = content.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]three['"]/);
    const imported = importMatch
      ? importMatch[1].split(',').map(s => s.trim().replace(/\s+as\s+\w+/, '')).filter(Boolean)
      : [];
    const news = [...content.matchAll(/new\s+([A-Z][a-zA-Z0-9]+)/g)].map(x => x[1]);
    for (const c of news) {
      if (threeClasses.includes(c) && !imported.includes(c)) {
        console.error(`[ERROR] File ${file} uses "new ${c}" but ${c} is NOT imported from 'three'!`);
        foundErrors++;
      }
    }
  }
}

if (foundErrors === 0) {
  console.log('Semua import Three.js valid!');
} else {
  console.log(`Ditemukan ${foundErrors} kesalahan import Three.js.`);
}
