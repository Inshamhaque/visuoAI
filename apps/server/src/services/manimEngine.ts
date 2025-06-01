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

  // Write the generated code to the temporary script file
  await fs.writeFile(filepath, code);

  // Extract scene class names from the code for rendering
  // Matches: class SceneName(Scene):
  const sceneClassNames = Array.from(
    code.matchAll(/class\s+(\w+)\(Scene\):/g)
  ).map((match) => match[1]);

  return new Promise((resolve, reject) => {
    // Run the render.py script with the python file path + scene names as args
    const args = [renderScript, filepath, ...sceneClassNames];
    const process = spawn("python3", args);

    process.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve(
          `Scene rendered successfully: ${filename}. Rendered scenes: ${sceneClassNames.join(
            ", "
          )}`
        );
      } else {
        reject(new Error("Manim render failed"));
      }
    });
  });
}
