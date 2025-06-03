import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function runManimCode(code: string): Promise<string> {
  const id = uuidv4();
  const filename = `scene_${id}.py`;
  const tempDir = path.join(__dirname, "../manim_scripts/temp");
  const filepath = path.join(tempDir, filename);
  const renderScript = path.join(__dirname, "../manim_scripts/render.py");

  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(filepath, code);

  const sceneClassNames = Array.from(
    code.matchAll(/class\s+(\w+)\(Scene\):/g)
  ).map((match) => match[1]);

  return new Promise((resolve, reject) => {
    const args = [renderScript, filepath, ...sceneClassNames];
    const process = spawn("python3", args);

    let outputPath = "";

    process.stdout.on("data", (data) => {
      const line = data.toString();
      console.log(`stdout: ${line}`);
      const match = line.match(/OUTPUT_FILE::(.*)/);
      if (match) {
        outputPath = match[1].trim();
      }
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("exit", (code) => {
      if (code === 0 && outputPath) {
        resolve(outputPath); // return actual file path
      } else {
        reject(new Error("Manim render failed or file not found"));
      }
    });
  });
}
