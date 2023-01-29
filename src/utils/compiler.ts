import initDevice from "./initDevice";
import compilerWGSL from "@/wgsl/compiler.wgsl";

export async function compiler() {
  const device = await initDevice();
  const time = 10;
  const fs = 200;
  var inp = [time, fs, 16, 1, 2, 1, 3.1416, 2, 2, 1, 440, 2, 2, 0, 0, 2, 2, 4, 1];
  for (var i = inp.length; i < 203; i++) {
    inp[i] = 0;
  }
  const start = performance.now();
  const input = new Float32Array(inp);

  const gpuBufferInput = device.createBuffer({
    mappedAtCreation: true,
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE,
  });
  const arrayBufferInput = gpuBufferInput.getMappedRange();

  new Float32Array(arrayBufferInput).set(input);
  gpuBufferInput.unmap();


  const resultBufferSize =
    Float32Array.BYTES_PER_ELEMENT * (Math.ceil(time * fs / 256) * 256);
  const resultBuffer = device.createBuffer({
    size: resultBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // Pipeline setup

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({
        code: compilerWGSL,
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
          buffer: gpuBufferInput,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: resultBuffer,
        },
      },
    ],
  });

  // Commands submission

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  const workgroupCountX = Math.ceil(time * fs / 256);
  passEncoder.dispatchWorkgroups(workgroupCountX);
  passEncoder.end();

  // Get a GPU buffer for reading in an unmapped state.
  const gpuReadBuffer = device.createBuffer({
    size: resultBufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  // Encode commands for copying buffer to buffer.
  commandEncoder.copyBufferToBuffer(
    resultBuffer /* source buffer */,
    0 /* source offset */,
    gpuReadBuffer /* destination buffer */,
    0 /* destination offset */,
    resultBufferSize /* size */
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
    result: Array.from(new Float32Array(arrayBuffer)),
  };
}
