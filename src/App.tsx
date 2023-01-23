import { example1, example1cpu } from './main/example1';
import { example2, example2cpu} from './main/matrixMul';
import { useState, useEffect } from 'react';
import example1code from './exp1code.png'

function App() {
  const [runtimegpuE1, setRuntimegpuE1] = useState(0.0);
  const [runtimecpuE1, setRuntimecpuE1] = useState(0.0);
  const [runtimegpuE2, setRuntimegpuE2] = useState(0.0);
  const [runtimecpuE2, setRuntimecpuE2] = useState(0.0);

  useEffect(() => {
    example1().then((response) => {
      setRuntimegpuE1(response);
    }).then((r) => {
    example1cpu().then((response) => {
      setRuntimecpuE1(response);
    })}).then((r) => {
    example2().then((response) => {
      setRuntimegpuE2(response);
    })}).then((r) => {
    example2cpu().then((response) => {
      setRuntimecpuE2(response);
    });});
  }, []);

  return (
    <div className="App">
      Example1:
      <br></br>
      GPU: {runtimegpuE1} ms
      <br></br>
      CPU: {runtimecpuE1} ms
      <br></br>
      Code: (N = 10, M = 10, C = 2)
      <img src={example1code} alt="" />
      Matrix Multiplication (16 * 2000000, 2000000 * 16):
      <br></br>
      GPU: {runtimegpuE2} ms
      <br></br>
      CPU: {runtimecpuE2} ms
      <br></br>
    </div>
  );
}

export default App;
