struct Element {
  typ: u32,
  number: f32,
}
struct Input {
  time: u32,
  fs: u32,
  length: u32,
  func: array<Element, 100>
}

fn cal(t: f32, len: u32, func: array<Element, 100>) -> f32{
  var stack : array<f32, 100>;
  var count = 0u;
  for (var i = 0u; i < len; i = i + 1u) {
    switch func[i].typ {
      case 0: {
        stack[count] = t;
        count = count + 1u;
      }
      case 1: {
        stack[count] = func[i].number;
        count = count + 1u;
      }
      case 2: {
        let x = stack[count - 1u];
        let y = stack[count - 2u];
        count = count - 2u;
        switch u32(func[i].number) {
          case 0: {
            stack[count] = x + y; 
          }
          case 1: {
            stack[count] = x - y;
          }
          case 2: {
            stack[count] = x * y;
          }
          case 3: {
            stack[count] = x / y;
          }
          default: {}
        }
        count = count + 1u;
      }
      case 3: {
        stack[count - 1u] = -stack[count - 1u];
      }
      case 4: {
        let x = stack[count - 1u];
        switch u32(func[i].number) {
          case 0: {
            count = count - 1u;
            stack[count] = abs(x); 
          }
          case 1: {
            count = count - 1u;
            stack[count] = sin(x);
          }
          case 2: {
            count = count - 1u;
            stack[count] = cos(x);
          }
          default: {}
        }
        count = count + 1u;
      }
      default: {
      }
    }
  }
  return stack[0];
}

@group(0) @binding(0) var<storage, read> input : Input;
@group(0) @binding(1) var<storage, read_write> result : array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let k = u32(ceil(f32(input.time * input.fs / 256)));
  for (var i = 0u; i < k; i = i + 1u) {
    let index = i + global_id.x * k;
    result[index] = cal(f32(index) / f32(input.fs), input.length, input.func);
  }
}