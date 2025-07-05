export function fixOverlapsInManimCode(code: string): string {
  let lines = code.split("\n");

  const modifiedLines = [];
  let currentScene = "";
  let objectStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detect scene start
    const sceneMatch = line.match(/class (\w+)\(Scene\):/);
    if (sceneMatch) {
      currentScene = sceneMatch[1];
      objectStack = [];
    }

    // Track object creation (Text, Rectangle, etc.)
    const objMatch = line.match(/(\w+)\s*=\s*(Text|Rectangle|Circle|Square|Dot|Arrow|Line|Triangle|Axes)\(.*\)/);
    if (objMatch) {
      objectStack.push(objMatch[1]); // push variable name
    }

    // Replace move_to(ORIGIN) with .to_edge() unless there's only one object
    if (line.includes(".move_to(ORIGIN)") && objectStack.length > 1) {
      line = line.replace(".move_to(ORIGIN)", `.to_edge(UP)  # auto-fixed`);
    }

    modifiedLines.push(line);

    // At end of construct(), inject arrange if multiple objects detected
    if (line.trim().startsWith("self.wait(") && objectStack.length > 1) {
      const arrangeLine = `        group = VGroup(${objectStack.join(", ")}).arrange(DOWN, buff=0.5)`;
      const playLine = `        self.play(Write(group))  # auto-arranged group`;
      modifiedLines.splice(modifiedLines.length - 1, 0, arrangeLine, playLine);
    }
  }

  return modifiedLines.join("\n");
}
