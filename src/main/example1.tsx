export async function example1(){
  var start = Date.now();
  if (!("gpu" in navigator)) {
    console.log("WebGPU is not supported. Enable chrome://flags/#enable-unsafe-webgpu flag.");
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.log("Failed to get GPU adapter.");
    return;
  }
  const device = await adapter.requestDevice();

  const N = 10;
  const M = 10;
  const C = 2;

  const size = new Int32Array([
    N, M, C
  ]);

  const gpuBufferIn = device.createBuffer({
    mappedAtCreation: true,
    size: size.byteLength,
    usage: GPUBufferUsage.STORAGE
  });
  const arrayBufferIn = gpuBufferIn.getMappedRange();

  new Int32Array(arrayBufferIn).set(size);
  gpuBufferIn.unmap();

  // Result Array

  const resultBufferSize = Float32Array.BYTES_PER_ELEMENT * (N * M * C);
  const resultBuffer = device.createBuffer({
    size: resultBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });


  // Compute shader code

  const shaderModule = device.createShaderModule({
    code: `
      @group(0) @binding(0) var<storage, read> input : array <u32, 3>;
      @group(0) @binding(1) var<storage, read_write> result : array <f32>;
      const X : u32 = 10;
      const Y : u32 = 10;
      const Z : u32 = 2;

      @compute @workgroup_size(X, Y, Z)
      fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        let x = global_id.x;
        let y = global_id.y;
        let z = global_id.z;
        let k = input[0u];

        let index = z + y * Z + x * Y * Z;
        result[index] = pow(f32(x), pow(f32(y), f32(z)));
      }
    `
  });
  
  // Pipeline setup
  
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: shaderModule,
      entryPoint: "main"
    }
  });


  // Bind group

  const bindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gpuBufferIn
        }
      },
      {
        binding: 1,
        resource: {
          buffer: resultBuffer
        }
      }
    ]
  });
  

  // Commands submission

  const commandEncoder = device.createCommandEncoder();


  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(1, 1, 1);
  passEncoder.end();

  // Get a GPU buffer for reading in an unmapped state.
  const gpuReadBuffer = device.createBuffer({
    size: resultBufferSize,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
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
  console.log("exp1 gpu: ", new Float32Array(arrayBuffer));
  var end = Date.now();
  console.log("exp1 gpu runtime: ", end - start);
  return end - start;
};

export async function example1cpu() {
  var start = Date.now();
  var result = new Array;
  for(var i = 0; i < 10; i ++) {
    result[i] = new Array;
    for(var j = 0; j < 10; j ++) {
      result[i][j] = new Array;
      for (var k = 0; k < 2; k ++) {
        result[i][j][k] = Math.pow(i, Math.pow(j, k));
      }
    }
  }
  console.log("exp1 cpu: ", result);
  var end = Date.now();
  return end - start;
}
