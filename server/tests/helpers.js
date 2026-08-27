const sharp = require('sharp');

async function makeTestSelfie({ faceCount = 1 } = {}) {
  const width = 200;
  const height = 200;
  const composites = [];
  const faceW = 60;
  const faceH = 75;
  const positions =
    faceCount === 1
      ? [{ left: 70, top: 60 }]
      : [
          { left: 30, top: 60 },
          { left: 110, top: 60 },
        ];

  for (const pos of positions.slice(0, faceCount)) {
    const face = await sharp({
      create: {
        width: faceW,
        height: faceH,
        channels: 3,
        background: { r: 210, g: 155, b: 120 },
      },
    })
      .png()
      .toBuffer();
    composites.push({ input: face, ...pos });
  }

  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 40, g: 40, b: 50 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

module.exports = { makeTestSelfie };
