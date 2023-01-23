import initDevice from "./initDevice";

export async function example2() {
  const col = 2000000;
  const firstMatrix = [16, col];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < col; j++) {
      firstMatrix[2 + i * 16 + j] = i + j;
    }
  }
  const secondMatrix = [col, 16];
  for (var i = 0; i < col; i++) {
    for (var j = 0; j < 16; j++) {
      secondMatrix[2 + i * 16 + j] = i + j;
    }
  }
  const start = Date.now();
  const device = await initDevice();

  const gpuBufferFirstMatrix = device.createBuffer({
    mappedAtCreation: true,
    size: firstMatrix.length * 4,
    usage: GPUBufferUsage.STORAGE,
  });
  const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();

  new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
  gpuBufferFirstMatrix.unmap();

  const gpuBufferSecondMatrix = device.createBuffer({
    mappedAtCreation: true,
    size: secondMatrix.length * 4,
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

  // Compute shader code

  const shaderModule = device.createShaderModule({
    code: `
      struct Matrix {
        size : vec2<f32>,
        numbers: array<f32>,
      }

      @group(0) @binding(0) var<storage, read> firstMatrix : Matrix;
      @group(0) @binding(1) var<storage, read> secondMatrix : Matrix;
      @group(0) @binding(2) var<storage, read_write> resultMatrix : Matrix;

      @compute @workgroup_size(16, 16)
      fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        // Guard against out-of-bounds work group sizes
        if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {
          return;
        }

        resultMatrix.size = vec2(firstMatrix.size.x, secondMatrix.size.y);

        let resultCell = vec2(global_id.x, global_id.y);
        var result = 0.0;
        for (var i = 0u; i < u32(firstMatrix.size.y); i = i + 1u) {
          let a = i + resultCell.x * u32(firstMatrix.size.y);
          let b = resultCell.y + i * u32(secondMatrix.size.y);
          result = result + firstMatrix.numbers[a] * secondMatrix.numbers[b];
        }

        let index = resultCell.y + resultCell.x * u32(secondMatrix.size.y);
        resultMatrix.numbers[index] = result;
      }
    `,
  });

  // Pipeline setup

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: shaderModule,
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
  const workgroupCountX = Math.ceil(firstMatrix[0] / 8);
  const workgroupCountY = Math.ceil(secondMatrix[1] / 8);
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
  const end = Date.now();
  return end - start;
}

export async function example2cpu() {
  const start = Date.now();
  const col = 2000000;
  const firstMatrix = [16, col];
  firstMatrix[0] = 16;
  firstMatrix[1] = col;
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < col; j++) {
      firstMatrix[2 + i * 16 + j] = i + j;
    }
  }
  const secondMatrix = [col, 16];
  secondMatrix[0] = col;
  secondMatrix[1] = 16;
  for (var i = 0; i < col; i++) {
    for (var j = 0; j < 16; j++) {
      secondMatrix[2 + i * 16 + j] = i + j;
    }
  }

  const result = new Array();
  for (var i = 0; i < 16; i++) {
    result[i] = new Array();
    for (var j = 0; j < 16; j++) {
      result[i][j] = 0;
      for (var k = 0; k < firstMatrix[1]; k++) {
        result[i][j] +=
          firstMatrix[2 + i * 16 + k] * secondMatrix[2 + k * 16 + j];
      }
    }
  }
  // console.log("exp2 cpu: ", result);
  const end = Date.now();
  return end - start;
}
