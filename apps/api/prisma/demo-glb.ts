/**
 * Generates a minimal valid glTF-Binary (.glb) file containing a simple colored box.
 * This is a proper binary GLB with a triangle mesh — no external dependencies needed.
 */
export function generateDemoGlb(color: [number, number, number] = [0.4, 0.4, 0.9]): Buffer {
  // A simple box mesh (8 vertices, 12 triangles)
  const positions = new Float32Array([
    // front
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    // back
     0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
    // top
    -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
    // bottom
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    // right
     0.5, -0.5,  0.5,  0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
    // left
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
  ]);

  const normals = new Float32Array([
     0,0,1,  0,0,1,  0,0,1,  0,0,1,
     0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
     0,1,0,  0,1,0,  0,1,0,  0,1,0,
     0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
     1,0,0,  1,0,0,  1,0,0,  1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
  ]);

  const indices = new Uint16Array([
    0,1,2,  0,2,3,    4,5,6,  4,6,7,    8,9,10,  8,10,11,
    12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23,
  ]);

  const posBuffer = Buffer.from(positions.buffer);
  const normBuffer = Buffer.from(normals.buffer);
  const idxBuffer = Buffer.from(indices.buffer);
  const binLength = posBuffer.length + normBuffer.length + idxBuffer.length;

  // Pad to 4-byte alignment
  const binPadded = binLength + (4 - (binLength % 4)) % 4;

  const json: any = {
    asset: { version: '2.0', generator: 'AR-Core Demo' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'DemoBox' }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [color[0], color[1], color[2], 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.7,
      },
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3',
        max: [0.5, 0.5, 0.5], min: [-0.5, -0.5, -0.5] },
      { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: posBuffer.length, byteLength: normBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: posBuffer.length + normBuffer.length, byteLength: idxBuffer.length, target: 34963 },
    ],
    buffers: [{ byteLength: binPadded }],
  };

  const jsonStr = JSON.stringify(json);
  const jsonBuf = Buffer.from(jsonStr);
  const jsonPadded = jsonBuf.length + (4 - (jsonBuf.length % 4)) % 4;
  const jsonChunk = Buffer.alloc(jsonPadded, 0x20); // pad with spaces
  jsonBuf.copy(jsonChunk);

  const binChunk = Buffer.alloc(binPadded, 0);
  posBuffer.copy(binChunk, 0);
  normBuffer.copy(binChunk, posBuffer.length);
  idxBuffer.copy(binChunk, posBuffer.length + normBuffer.length);

  // GLB header: magic(4) + version(4) + length(4)
  // JSON chunk: length(4) + type(4) + data
  // BIN chunk:  length(4) + type(4) + data
  const totalLength = 12 + 8 + jsonPadded + 8 + binPadded;
  const glb = Buffer.alloc(totalLength);
  let offset = 0;

  // GLB header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4; // 'glTF'
  glb.writeUInt32LE(2, offset); offset += 4;           // version 2
  glb.writeUInt32LE(totalLength, offset); offset += 4;

  // JSON chunk
  glb.writeUInt32LE(jsonPadded, offset); offset += 4;
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4; // 'JSON'
  jsonChunk.copy(glb, offset); offset += jsonPadded;

  // BIN chunk
  glb.writeUInt32LE(binPadded, offset); offset += 4;
  glb.writeUInt32LE(0x004E4942, offset); offset += 4; // 'BIN\0'
  binChunk.copy(glb, offset);

  return glb;
}
