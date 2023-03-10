import initDevice from "./initDevice";
import matrixMul2WGSL from "@/wgsl/matrixMul2.wgsl";
const LENGTH_CONST = 512;
const LENGTH_CONST_2 = 2;

export async function matrixMulGpu() {
  const device = await initDevice();
  const start = performance.now();
  const first = [LENGTH_CONST_2, LENGTH_CONST_2];
  for (let i = 0; i < LENGTH_CONST_2 * LENGTH_CONST_2; i++) {
    first[2 + i] = i;
  }

  const second = [LENGTH_CONST_2, LENGTH_CONST_2];
  for (let i = 0; i < LENGTH_CONST_2 * LENGTH_CONST_2; i++) {
    second[2 + i] = i;
  }

  const firstMatrix = new Float32Array(first);
  const secondMatrix = new Float32Array(second);

  const gpuBufferFirstMatrix = device.createBuffer({
    mappedAtCreation: true,
    size: firstMatrix.byteLength,
    usage: GPUBufferUsage.STORAGE,
  });
  const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();

  new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
  gpuBufferFirstMatrix.unmap();

  const gpuBufferSecondMatrix = device.createBuffer({
    mappedAtCreation: true,
    size: secondMatrix.byteLength,
    usage: GPUBufferUsage.STORAGE,
  });
  const arrayBufferSecondMatrix = gpuBufferSecondMatrix.getMappedRange();
  new Float32Array(arrayBufferSecondMatrix).set(secondMatrix);
  gpuBufferSecondMatrix.unmap();

  // Result Matrix

  const resultMatrixBufferSize =
    Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
  const resultMatrixBuffer = device.createBuffer({
    size: resultMatrixBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // Pipeline setup

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({
        code: `struct Matrix{size : vec2<f32>,numbers: array<f32>,}@group(0)@binding(0)var<storage,read>firstMatrix:Matrix;@group(0)@binding(1)var<storage,read>secondMatrix:Matrix;@group(0) @binding(2) var<storage, read_write> resultMatrix : Matrix;@compute @workgroup_size(16, 16)fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {return;}resultMatrix.size = vec2(firstMatrix.size.x, secondMatrix.size.y);let resultCell = vec2(global_id.x, global_id.y);var result = 0.0;for (var i = 0u; i < u32(firstMatrix.size.y); i = i + 1u) {let a = i + resultCell.x * u32(firstMatrix.size.y);let b = resultCell.y + i * u32(secondMatrix.size.y);result = result + firstMatrix.numbers[a] * secondMatrix.numbers[b];}let index = resultCell.y + resultCell.x * u32(secondMatrix.size.y);resultMatrix.numbers[index] = result;}`,
      }),
      entryPoint: "main",
    },
  });

  // Bind group

  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0 /* index */),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gpuBufferFirstMatrix,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: gpuBufferSecondMatrix,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: resultMatrixBuffer,
        },
      },
    ],
  });

  // Commands submission

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  const workgroupCountX = Math.ceil(firstMatrix[0] / 16);
  const workgroupCountY = Math.ceil(secondMatrix[1] / 16);
  passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
  passEncoder.end();

  // Get a GPU buffer for reading in an unmapped state.
  const gpuReadBuffer = device.createBuffer({
    size: resultMatrixBufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  // Encode commands for copying buffer to buffer.
  commandEncoder.copyBufferToBuffer(
    resultMatrixBuffer /* source buffer */,
    0 /* source offset */,
    gpuReadBuffer /* destination buffer */,
    0 /* destination offset */,
    resultMatrixBufferSize /* size */
  );

  // Submit GPU commands.
  const gpuCommands = commandEncoder.finish();
  device.queue.submit([gpuCommands]);

  // Read buffer.
  await gpuReadBuffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = gpuReadBuffer.getMappedRange();
  const end = performance.now();
  return {
    runtime: end - start,
    matrix: Array.from(new Float32Array(arrayBuffer)),
  };
}

export async function matrixMulCpu() {
  const start = performance.now();
  const firstMatrix = [LENGTH_CONST, LENGTH_CONST];
  for (let i = 0; i < LENGTH_CONST; i++) {
    for (let j = 0; j < LENGTH_CONST; j++) {
      firstMatrix[2 + i * LENGTH_CONST + j] = i + j;
    }
  }
  const secondMatrix = [LENGTH_CONST, LENGTH_CONST];
  for (let i = 0; i < LENGTH_CONST; i++) {
    for (let j = 0; j < LENGTH_CONST; j++) {
      secondMatrix[2 + i * LENGTH_CONST + j] = i + j;
    }
  }

  const result = new Array();
  for (let i = 0; i < LENGTH_CONST; i++) {
    result[i] = new Array();
    for (let j = 0; j < LENGTH_CONST; j++) {
      result[i][j] = 0;
      for (let k = 0; k < firstMatrix[1]; k++) {
        result[i][j] +=
          firstMatrix[2 + i * LENGTH_CONST + k] *
          secondMatrix[2 + k * LENGTH_CONST + j];
      }
    }
  }
  const end = performance.now();
  return { runtime: end - start, matrix: result };
}
