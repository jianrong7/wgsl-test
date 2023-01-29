import styles from "@/styles/Home.module.css";
// import { example1, example1cpu } from "@/utils/example";
// import { example2, example2cpu } from "@/utils/matrixMul";
// import { matrixMulCpu, matrixMulGpu } from "@/utils/matrixMul2";
import { compiler } from "@/utils/compiler";
import { useState, useEffect } from "react";

interface RuntimeState {
  runtime: number;
  result: number[];
}

export default function Home() {
  const [gpuRuntime, setGpuRuntime] = useState<RuntimeState>({
    runtime: 0.0,
    result: [],
  });


  useEffect(() => {
    executeCalc();
  }, []);

  const executeCalc = async () => {
    let gpuTime = await compiler();
    setGpuRuntime(gpuTime);
    console.log("Result:", gpuTime.result);
  };

  return (
    <main className={styles.main}>
      <div>
        <p>
          GPU Runtime: <span>{gpuRuntime.runtime} ms</span>
        </p>
      </div>
      <button onClick={executeCalc}>Rerun</button>
    </main>
  );
}
