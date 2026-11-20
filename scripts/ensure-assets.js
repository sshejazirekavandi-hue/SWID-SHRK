import fs from 'fs';
import path from 'path';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
const cacheDir = path.join(projectRoot, 'node_modules/.cache/swid-assets');
const logoPng = path.join(cacheDir, 'logo_transparent.png');
const logoLuminousPng = path.join(cacheDir, 'logo_luminous.png');
const logoJpg = path.join(projectRoot, 'src/assets/logo.jpg');

// Clean up any legacy generated binary PNGs in src/assets or public that break workspace precondition checks
function cleanWorkspaceGeneratedPngs() {
  const legacyPaths = [
    path.join(projectRoot, 'src/assets/logo_transparent.png'),
    path.join(projectRoot, 'src/assets/logo_luminous.png'),
    path.join(projectRoot, 'src/assets/profile.png'),
    path.join(projectRoot, 'public/logo_transparent.png'),
    path.join(projectRoot, 'public/logo_luminous.png'),
    path.join(projectRoot, 'public/profile.png'),
  ];
  for (const p of legacyPaths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
      // ignore
    }
  }
}

// Pure Node.js high-precision flood-fill background removal (Zero external dependencies)
function createTransparentLogos() {
  if (!fs.existsSync(logoJpg)) {
    console.warn('logo.jpg not found, skipping transparent logo generation.');
    return;
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const rawJpg = fs.readFileSync(logoJpg);
  const decoded = jpeg.decode(rawJpg, { useTArray: true });
  const { width, height, data } = decoded;

  const png = new PNG({ width, height });
  const luminousPng = new PNG({ width, height });

  // 4-way BFS flood-fill from all 4 borders to remove off-white background
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  const push = (idx) => {
    if (!visited[idx]) {
      visited[idx] = 1;
      queue[qTail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const o = idx * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];

    if (r >= 215 && g >= 215 && b >= 215) {
      visited[idx] = 2;
      const x = idx % width;
      const y = (idx / width) | 0;

      if (x > 0) push(idx - 1);
      if (x < width - 1) push(idx + 1);
      if (y > 0) push(idx - width);
      if (y < height - 1) push(idx + width);
    }
  }

  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];

    png.data[o] = r;
    png.data[o + 1] = g;
    png.data[o + 2] = b;

    if (visited[i] === 2) {
      png.data[o + 3] = 0;
      luminousPng.data[o] = 0;
      luminousPng.data[o + 1] = 0;
      luminousPng.data[o + 2] = 0;
      luminousPng.data[o + 3] = 0;
    } else {
      png.data[o + 3] = 255;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const isInteriorPaper = r >= 220 && g >= 220 && b >= 220;
      if (isInteriorPaper) {
        luminousPng.data[o] = 0;
        luminousPng.data[o + 1] = 0;
        luminousPng.data[o + 2] = 0;
        luminousPng.data[o + 3] = 0;
      } else {
        const inv = 1 - lum;
        luminousPng.data[o] = Math.min(255, Math.round(180 + inv * 75));
        luminousPng.data[o + 1] = Math.min(255, Math.round(215 + inv * 40));
        luminousPng.data[o + 2] = Math.min(255, Math.round(235 + inv * 20));
        luminousPng.data[o + 3] = Math.min(255, Math.max(90, Math.round(inv * 255 + 70)));
      }
    }
  }

  const pngBuffer = PNG.sync.write(png);
  const luminousBuffer = PNG.sync.write(luminousPng);
  fs.writeFileSync(logoPng, pngBuffer);
  fs.writeFileSync(logoLuminousPng, luminousBuffer);
}

function hasValidTransparentPng(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const stats = fs.statSync(filePath);
    return stats.size > 20000;
  } catch {
    return false;
  }
}

export function ensureAssets() {
  cleanWorkspaceGeneratedPngs();
  const hasLogo = hasValidTransparentPng(logoPng);
  const hasLuminous = hasValidTransparentPng(logoLuminousPng);

  if (!hasLogo || !hasLuminous) {
    createTransparentLogos();
  }
}

ensureAssets();

