import styles from "@/styles/Interpreter.module.css";
import generateWgsl from "@/utils/generateWgsl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Interpreter() {
  const { register, handleSubmit } = useForm();
  const [usedGpu, setUsedGpu] = useState(false);
  const [resultMatrix, setResultMatrix] = useState([0, 0]);
  const onSubmit = handleSubmit(async (data) => {
    setUsedGpu(await generateWgsl(data?.code, setResultMatrix));
  });

  useEffect(() => {
    console.log(resultMatrix);
  }, [resultMatrix]);

  return (
    <>
      <h1>Interpreter (Only matrix multiplication)</h1>
      <Link href="/">Home</Link>
      <main className={styles.main}>
        <div>
          <form onSubmit={onSubmit} className={styles.form}>
            <textarea
              {...register("code")}
              cols={80}
              rows={40}
              className={styles.input}
            ></textarea>
            <button type="submit" className={styles.submit}>
              Submit
            </button>
          </form>
        </div>
        <div className={styles.output}>
          <h2>WGSL Output</h2>
          <p>Did it use the GPU? {usedGpu ? "Yes" : "No"}</p>
          <p>
            Result {resultMatrix && resultMatrix.map((x) => <span>{x}</span>)}
          </p>
        </div>
      </main>
    </>
  );
}
