import styles from "@/styles/Home.module.css";
// import { example1, example1cpu } from "@/utils/example";
// import { example2, example2cpu } from "@/utils/matrixMul";
import { matrixMulCpu, matrixMulGpu } from "@/utils/matrixMul2";
import { compiler } from "@/utils/compiler";
import { useState, useEffect } from "react";
import Link from "next/link";

interface RuntimeState {
  runtime: number;
  matrix: number[];
}

export default function Home() {
  const [gpuRuntime, setGpuRuntime] = useState<RuntimeState>({
    runtime: 0.0,
    matrix: [],
  });

  useEffect(() => {
    executeCalc();
  }, []);

  const executeCalc = async () => {
    let gpuTime = await matrixMulGpu();
    setGpuRuntime(gpuTime);
    console.log("Result:", gpuTime.matrix);
  };

  return (
    <main className={styles.main}>
      <Link href="/interpreter">Interpreter</Link>
      <div>
        <p>
          GPU Runtime: <span>{gpuRuntime.runtime} ms</span>
        </p>
      </div>
      <button onClick={executeCalc}>Rerun</button>
    </main>
  );
}
