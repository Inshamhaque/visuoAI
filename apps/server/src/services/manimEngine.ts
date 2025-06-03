import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface VideoResult {
  scene: string;
  path: string;
}

export async function runManimCode(
  code: string
): Promise<{ animationId: string; videos: VideoResult[] }> {
  const animationId = uuidv4();
  const filename = `scene_${animationId}.py`;
  const tempDir = path.join(__dirname, "../manim_scripts/temp");
  const filepath = path.join(tempDir, filename);
  const renderScript = path.join(__dirname, "../manim_scripts/render.py");

  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(filepath, code);

  const sceneClassNames = Array.from(
    code.matchAll(/class\s+(\w+)\(Scene\):/g)
  ).map((match) => match[1]);

  if (sceneClassNames.length === 0) {
    throw new Error("No Scene classes found in the provided code");
  }

  console.log(
    `Found ${sceneClassNames.length} scenes: ${sceneClassNames.join(", ")}`
  );

  return new Promise((resolve, reject) => {
    const args = [renderScript, filepath, ...sceneClassNames];
    const process = spawn("python3", args, {
      cwd: path.join(__dirname, "../manim_scripts"),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let outputVideos: VideoResult[] = [];
    let stdoutBuffer = "";
    let stderrBuffer = "";

    process.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdoutBuffer += chunk;
      console.log(`stdout: ${chunk}`);

      // Process complete lines
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() || ""; // Keep incomplete line

      for (const line of lines) {
        // Look for our output format: OUTPUT_FILE::scene_name::file_path
        const match = line.match(/OUTPUT_FILE::([^:]+)::(.*)/);
        if (match) {
          const [, sceneName, filePath] = match;
          outputVideos.push({
            scene: sceneName.trim(),
            path: filePath.trim(),
          });
          console.log(`Captured video: ${sceneName} -> ${filePath}`);
        }
      }
    });

    process.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderrBuffer += chunk;
      console.error(`stderr: ${chunk}`);
    });

    process.on("close", (code) => {
      console.log(`Process exited with code: ${code}`);
      console.log(`Captured ${outputVideos.length} video files`);

      if (code === 0 && outputVideos.length > 0) {
        // Verify all files exist
        const validVideos = outputVideos.filter((video) => {
          try {
            require("fs").accessSync(video.path);
            return true;
          } catch (err) {
            console.warn(`Video file not found: ${video.path}`);
            return false;
          }
        });

        if (validVideos.length === 0) {
          reject(new Error("No valid video files found after rendering"));
          return;
        }

        resolve({
          animationId,
          videos: validVideos,
        });
      } else {
        const errorMsg =
          code !== 0
            ? `Manim render failed with exit code ${code}`
            : "No video files were generated";

        if (stderrBuffer) {
          console.error("Full stderr:", stderrBuffer);
        }

        reject(new Error(`${errorMsg}. Check logs for details.`));
      }
    });

    process.on("error", (err) => {
      console.error("Process error:", err);
      reject(new Error(`Failed to spawn render process: ${err.message}`));
    });

    // Set a timeout to prevent hanging
    const timeout = setTimeout(
      () => {
        console.error("Render process timed out");
        process.kill("SIGTERM");
        reject(new Error("Render process timed out after 5 minutes"));
      },
      5 * 60 * 1000
    ); // 5 minutes

    process.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
