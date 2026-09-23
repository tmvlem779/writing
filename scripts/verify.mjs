import { spawnSync } from "node:child_process";

const pnpmCli = process.env.npm_execpath;
const tasks = ["lint", "typecheck", "test", "check:principles", "check:security", "eval"];

for (const task of tasks) {
  console.log(`\n[verify] ${task}`);
  const command = pnpmCli ? process.execPath : process.platform === "win32" ? "cmd.exe" : "pnpm";
  const args = pnpmCli
    ? [pnpmCli, "run", task]
    : process.platform === "win32"
      ? ["/d", "/s", "/c", "pnpm.cmd", "run", task]
      : ["run", task];
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\n[verify] 모든 검증 통과");
