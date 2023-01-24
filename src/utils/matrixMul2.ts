import initDevice from "./initDevice";
import matrixMul2WGSL from "@/wgsl/matrixMul2.wgsl";
const LENGTH_CONST = 512;

export async function matrixMulGpu() {
  const device = await initDevice();
  const start = performance.now();
  const first = [LENGTH_CONST, LENGTH_CONST];
  for (var i = 0; i < LENGTH_CONST; i++) {
    for (var j = 0; j < LENGTH_CONST; j++) {
      first[2 + i * LENGTH_CONST + j] = i + j;
    }
  }
  const second = [LENGTH_CONST, LENGTH_CONST];
  for (var i = 0; i < LENGTH_CONST; i++) {
    for (var j = 0; j < LENGTH_CONST; j++) {
      second[2 + i * LENGTH_CONST + j] = i + j;
    }
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
        code: matrixMul2WGSL,
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
  // console.log("gpu:", new Float32Array(arrayBuffer));
  const end = performance.now();
  return end - start;
}

export async function matrixMulCpu() {
  const start = performance.now();
  const firstMatrix = [LENGTH_CONST, LENGTH_CONST];
  for (var i = 0; i < LENGTH_CONST; i++) {
    for (var j = 0; j < LENGTH_CONST; j++) {
      firstMatrix[2 + i * LENGTH_CONST + j] = i + j;
    }
  }
  const secondMatrix = [LENGTH_CONST, LENGTH_CONST];
  for (var i = 0; i < LENGTH_CONST; i++) {
    for (var j = 0; j < LENGTH_CONST; j++) {
      secondMatrix[2 + i * LENGTH_CONST + j] = i + j;
    }
  }

  const result = new Array();
  for (var i = 0; i < LENGTH_CONST; i++) {
    result[i] = new Array();
    for (var j = 0; j < LENGTH_CONST; j++) {
      result[i][j] = 0;
      for (var k = 0; k < firstMatrix[1]; k++) {
        result[i][j] +=
          firstMatrix[2 + i * LENGTH_CONST + k] *
          secondMatrix[2 + k * LENGTH_CONST + j];
      }
    }
  }
  console.log("exp2 cpu: ", result);
  const end = performance.now();
  return end - start;
}
