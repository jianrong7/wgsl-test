import multiplyMatrixInterp from "./interpreter";

export default async function generateWgsl(code: string, setResultMatrix) {
  if (code.includes("multiplyMatrix_gpu")) {
    console.log("GPU", code);
    let split_code = code.split(";").map((x) => x.replace("\n", ""));
    let parsed_map = {};
    let firstMatrix = [];
    let secondMatrix = [];
    split_code.forEach((x) => {
      if (x.includes("let")) {
        let split_stmt = x.split("=");
        parsed_map[split_stmt[0].replace("let", "").trim()] =
          split_stmt[1].trim();
      } else if (x.includes("multiplyMatrix_gpu")) {
        let split_stmt = x
          .substring(x.indexOf("(") + 1, x.lastIndexOf(")"))
          .split(",");
        firstMatrix = JSON.parse(parsed_map[split_stmt[0].trim()]);
        secondMatrix = JSON.parse(parsed_map[split_stmt[1].trim()]);
      }
    });

    setResultMatrix(await multiplyMatrixInterp(firstMatrix, secondMatrix));
    return true;
  } else {
    return false;
    // return eval(code);
  }
}
