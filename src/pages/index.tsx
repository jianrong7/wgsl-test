import styles from "@/styles/Home.module.css";
// import { example1, example1cpu } from "@/utils/example";
// import { example2, example2cpu } from "@/utils/matrixMul";
import { matrixMulCpu, matrixMulGpu } from "@/utils/matrixMul2";
import { useState, useEffect } from "react";

interface RuntimeState {
  runtime: number;
  matrix: number[];
}

export default function Home() {
  const [gpuRuntime, setGpuRuntime] = useState<RuntimeState>({
    runtime: 0.0,
    matrix: [],
  });
  const [cpuRuntime, setCpuRuntime] = useState<RuntimeState>({
    runtime: 0.0,
    matrix: [],
  });

  useEffect(() => {
    executeCalc();
  }, []);

  const executeCalc = async () => {
    let gpuTime = await matrixMulGpu();
    let cpuTime = await matrixMulCpu();
    setGpuRuntime(gpuTime);
    setCpuRuntime(cpuTime);
    console.log("GPU Matrix Result:", gpuTime.matrix);
    console.log("CPU Matrix Result:", cpuTime.matrix);
  };

  return (
    <main className={styles.main}>
      <div>
        <p>
          GPU Runtime: <span>{gpuRuntime.runtime} ms</span>
        </p>
        {/* <p>
          GPU Array:
          <div>
            {gpuRuntime.matrix.map((row, rowIdx) => (
              <div key={rowIdx}>
                {row.map((item, itemIdx) => (
                  <div key={itemIdx}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </p> */}
        <p>
          CPU Runtime: <span>{cpuRuntime.runtime} ms</span>
        </p>
      </div>
      <button onClick={executeCalc}>Rerun</button>
    </main>
  );
}
