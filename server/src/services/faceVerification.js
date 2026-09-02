const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../config');

const SELFIE_DIR = path.join(__dirname, '../../uploads/selfies');
const FACE_GRID_W = 120;
const FACE_GRID_H = 90;
const MIN_FACE_BLOB_RATIO = 0.02;

function ensureDir() {
  if (!fs.existsSync(SELFIE_DIR)) {
    fs.mkdirSync(SELFIE_DIR, { recursive: true });
  }
}

function parseBase64Image(base64Data) {
  const matches = base64Data.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!matches) {
    const err = new Error('Invalid image format — JPEG or PNG only');
    err.status = 400;
    throw err;
  }
  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > config.maxSelfieBytes) {
    const err = new Error(`Image too large — max ${Math.round(config.maxSelfieBytes / 1024 / 1024)}MB`);
    err.status = 400;
    throw err;
  }
  if (buffer.length < 100) {
    const err = new Error('Image too small — capture a clear selfie');
    err.status = 400;
    throw err;
  }
  return buffer;
}

function isSkinTone(r, g, b) {
  return (
    r > 60 &&
    g > 40 &&
    b > 20 &&
    r > g &&
    r > b &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(r - g) > 15
  );
}

async function countFaceRegions(buffer) {
  const { data } = await sharp(buffer)
    .resize(FACE_GRID_W, FACE_GRID_H, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = FACE_GRID_W * FACE_GRID_H;
  const skin = new Uint8Array(pixels);
  for (let i = 0; i < data.length; i += 3) {
    skin[i / 3] = isSkinTone(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
  }

  const visited = new Uint8Array(pixels);
  const minBlobSize = Math.floor(pixels * MIN_FACE_BLOB_RATIO);
  let faceCount = 0;

  function floodFill(start) {
    const stack = [start];
    let size = 0;
    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx] || !skin[idx]) continue;
      visited[idx] = 1;
      size += 1;
      const x = idx % FACE_GRID_W;
      const y = Math.floor(idx / FACE_GRID_W);
      if (x > 0) stack.push(idx - 1);
      if (x < FACE_GRID_W - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - FACE_GRID_W);
      if (y < FACE_GRID_H - 1) stack.push(idx + FACE_GRID_W);
    }
    return size;
  }

  for (let i = 0; i < pixels; i += 1) {
    if (skin[i] && !visited[i]) {
      const size = floodFill(i);
      if (size >= minBlobSize) faceCount += 1;
    }
  }

  return faceCount;
}

async function validateSelfieBuffer(buffer) {
  const faceCount = await countFaceRegions(buffer);
  if (faceCount === 0) {
    return {
      valid: false,
      faceCount,
      error: 'No face detected — position your face in the frame and retake',
    };
  }
  if (faceCount > 1) {
    return {
      valid: false,
      faceCount,
      error: 'Multiple faces detected — retake with only your face visible',
    };
  }
  return { valid: true, faceCount };
}

async function saveSelfie(base64Data, prefix, userId) {
  ensureDir();
  const buffer = parseBase64Image(base64Data);
  const validation = await validateSelfieBuffer(buffer);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.status = 400;
    throw err;
  }

  const filename = `${prefix}_${userId}_${Date.now()}.jpg`;
  const filepath = path.join(SELFIE_DIR, filename);

  await sharp(buffer)
    .resize(128, 128, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toFile(filepath);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { filepath, relativePath: `uploads/selfies/${filename}`, hash };
}

async function computePerceptualHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  let hash = '';
  for (let i = 0; i < data.length; i++) {
    hash += data[i] >= avg ? '1' : '0';
  }
  return hash;
}

function scoreFromHashes(refHash, voteHash) {
  const distance = hammingDistance(refHash, voteHash);
  const score = 1 - distance / refHash.length;
  return {
    score: Math.round(score * 1000) / 1000,
    anomaly: score < config.faceAnomalyThreshold,
    matched: score >= config.faceMatchThreshold,
    distance,
  };
}

function resolveSelfiePath(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(__dirname, '../..', relativeOrAbsolute);
}

function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

async function compareFaces(referencePath, votePath) {
  if (!referencePath || !votePath) {
    return { score: 0, anomaly: true, reason: 'Missing selfie' };
  }

  const refFull = resolveSelfiePath(referencePath);
  const voteFull = resolveSelfiePath(votePath);

  if (!fs.existsSync(refFull) || !fs.existsSync(voteFull)) {
    return { score: 0, anomaly: true, reason: 'Selfie file not found' };
  }

  const [refHash, voteHash] = await Promise.all([
    computePerceptualHash(refFull),
    computePerceptualHash(voteFull),
  ]);

  return scoreFromHashes(refHash, voteHash);
}

module.exports = {
  saveSelfie,
  compareFaces,
  countFaceRegions,
  validateSelfieBuffer,
  SELFIE_DIR,
};
