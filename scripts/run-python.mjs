import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const local = process.platform === "win32" ? `${root}.venv/Scripts/python.exe` : `${root}.venv/bin/python`;
const candidates = [local, "python3", "python"];
let interpreter;

for (const candidate of candidates) {
  if (candidate === local && !existsSync(candidate)) continue;
  const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
  if (!probe.error && probe.status === 0) {
    interpreter = candidate;
    break;
  }
}

if (!interpreter) {
  console.error("No usable Python interpreter found. Create .venv or install python3.");
  process.exit(127);
}

const result = spawnSync(interpreter, process.argv.slice(2), { cwd: root, stdio: "inherit" });
if (result.error) {
  console.error(`Unable to start ${interpreter}: ${result.error.message}`);
  process.exit(126);
}
process.exit(result.status ?? 1);
