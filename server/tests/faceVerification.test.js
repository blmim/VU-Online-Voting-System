const { countFaceRegions, validateSelfieBuffer } = require('../src/services/faceVerification');
const { makeTestSelfie } = require('./helpers');
const sharp = require('sharp');

describe('Face region detection', () => {
  it('detects one face in synthetic selfie', async () => {
    const dataUrl = await makeTestSelfie({ faceCount: 1 });
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const count = await countFaceRegions(buffer);
    expect(count).toBe(1);
  });

  it('detects multiple faces in synthetic selfie', async () => {
    const dataUrl = await makeTestSelfie({ faceCount: 2 });
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const count = await countFaceRegions(buffer);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('rejects image with no face-like regions', async () => {
    const buffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 10, g: 10, b: 10 } },
    })
      .jpeg()
      .toBuffer();
    const result = await validateSelfieBuffer(buffer);
    expect(result.valid).toBe(false);
    expect(result.faceCount).toBe(0);
  });
});
