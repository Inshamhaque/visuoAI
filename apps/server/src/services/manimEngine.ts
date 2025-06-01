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

  // Ensure temp directory exists
  await fs.mkdir(tempDir, { recursive: true });

  await fs.writeFile(filepath, code);

  return new Promise((resolve, reject) => {
    const process = spawn("python3", [renderScript, filepath]);

    process.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve(`Scene rendered successfully: ${filename}`);
      } else {
        reject(new Error("Manim render failed"));
      }
    });
  });
}
