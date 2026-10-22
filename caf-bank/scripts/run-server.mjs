import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import ts from "typescript";

for (const file of ["src/server.ts", "scripts/create-admin.ts", "src/lib/mongodb.ts", "src/lib/models.ts"]) {
  const source = readFileSync(file, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const target = join(".server", file.replace(/\.ts$/, ".js"));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output);
}
const mode = process.argv[2] === "production" ? "production" : "development";
const entry = process.argv[2] === "admin" ? join(".server", "scripts", "create-admin.js") : join(".server", "src", "server.js");
const child = spawn(process.execPath, [entry], { stdio: "inherit", env: { ...process.env, NODE_ENV: mode } });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 0));
