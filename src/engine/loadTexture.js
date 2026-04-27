const textureMap = new Map();

export let currentPack = 'igneous';
export function setTexturePack(name) { currentPack = name; }

export function getTextureCoords(src) {
  return textureMap.get(src);
}

async function blendTexture(img, texSize, r, g, b) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = texSize; canvas.height = texSize;
  r /= 255; g /= 255; b /= 255;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, texSize, texSize);
  const D = imageData.data;
  const n = 1 / 3;
  for (let i = 0; i < D.length; i += 4) {
    if (D[i + 3] === 0) { D[i] = r; D[i+1] = g; D[i+2] = b; }
    else { const l = (D[i]+D[i+1]+D[i+2])*n; D[i]=l*r; D[i+1]=l*g; D[i+2]=l*b; }
  }
  ctx.putImageData(imageData, 0, 0);
  return createImageBitmap(canvas);
}

const TINT = {
  'grass_block_top':  [0x7a, 0xb8, 0x45],
  'oak_leaves':       [0x68, 0xa1, 0x30],
  'birch_leaves':     [0x80, 0xa7, 0x55],
  'spruce_leaves':    [0x61, 0x99, 0x61],
  'jungle_leaves':    [0x68, 0xa1, 0x30],
  'acacia_leaves':    [0x68, 0xa1, 0x30],
  'dark_oak_leaves':  [0x68, 0xa1, 0x30],
  'mangrove_leaves':  [0x68, 0xa1, 0x30],
  'grass':            [0x7a, 0xb8, 0x45],
  'fern':             [0x7a, 0xb8, 0x45],
  'tall_grass_bottom':[0x7a, 0xb8, 0x45],
  'tall_grass_top':   [0x7a, 0xb8, 0x45],
};

// zipOverrides: Map<name, Blob> from user-uploaded ZIP
export async function create3DTexture(gl, images, texSize, zipOverrides = null) {
  images = Array.from(images);
  const depth = images.length;
  const bitmaps = await Promise.all(images.map(src => fetchImage(src, texSize, zipOverrides)));

  const texture = gl.createTexture();
  const TEX = gl.TEXTURE_2D_ARRAY;
  gl.bindTexture(TEX, texture);
  gl.texImage3D(TEX, 0, gl.RGBA, texSize, texSize, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  for (let i = 0; i < depth; i++) {
    const src = images[i];
    let bitmap = bitmaps[i];
    if (TINT[src]) {
      const [r, g, b] = TINT[src];
      bitmap = await blendTexture(bitmap, texSize, r, g, b);
    }
    gl.texSubImage3D(TEX, 0, 0, 0, i, texSize, texSize, 1, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    textureMap.set(src, [0,0,i, 1,0,i, 1,1,i, 0,1,i]);
  }

  gl.texParameteri(TEX, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(TEX, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap(TEX);
  gl.bindTexture(TEX, null);
  return texture;
}

async function fetchImage(name, texSize, zipOverrides) {
  const options = { resizeWidth: texSize, resizeHeight: texSize, resizeQuality: 'pixelated' };
  if (zipOverrides?.has(name)) {
    return await createImageBitmap(zipOverrides.get(name), options);
  }
  const url = `${import.meta.env.BASE_URL}textures/packs/${currentPack}/blocks/${name}.png`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw 0;
    const blob = await r.blob();
    return await createImageBitmap(blob, options);
  } catch {
    return await makeFallback(texSize);
  }
}

function makeFallback(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff00ff'; ctx.fillRect(0,0,size,size);
  ctx.fillStyle = '#000';    ctx.fillRect(0,0,size/2,size/2);
  ctx.fillRect(size/2,size/2,size/2,size/2);
  return createImageBitmap(c);
}
