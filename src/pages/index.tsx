import styles from "@/styles/Home.module.css";
// import { example1, example1cpu } from "@/utils/example";
// import { example2, example2cpu } from "@/utils/matrixMul";
import { matrixMulCpu, matrixMulGpu } from "@/utils/matrixMul2";
import { useState, useEffect } from "react";

export default function Home() {
  const [runtimegpuE1, setRuntimegpuE1] = useState(0.0);
  const [runtimecpuE1, setRuntimecpuE1] = useState(0.0);
  const [runtimegpuE2, setRuntimegpuE2] = useState(0.0);
  const [runtimecpuE2, setRuntimecpuE2] = useState(0.0);

  useEffect(() => {
    const init = async () => {
      let responses = await Promise.all([
        // example1(),
        // example1cpu(),
        matrixMulGpu(),
        matrixMulCpu(),
      ]);
      // const res = (await example1()) as number;
      // setRuntimegpuE1(res);
      for (let i = 0; i < responses.length; i++) {
        console.log(i, responses[i]);
        // console.log(response);
        // setRuntimecpuE1(response)
      }
    };
    init();
  }, []);
  return (
    <main className={styles.main}>
      CPU Runtime: <span>{runtimecpuE1}</span>
      GPU Runtime: <span>{runtimegpuE1}</span>
    </main>
  );
}
