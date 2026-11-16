import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile(
  "main.ts",
  readFileSync(resolve(process.cwd(), "desktop/src/main.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);

/** Execute real Desktop functions without starting Tauri, Three.js or the UI. */
export function desktopMainFunctions(
  names: string[],
  globals: Record<string, unknown>,
) {
  const declarations = names.map((name) => {
    const declaration = source.statements.find(
      (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
    );
    if (!declaration) throw new Error(`Missing Desktop function: ${name}`);
    return declaration.getText(source);
  });
  const code = ts.transpileModule(declarations.join("\n"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = createContext(globals);
  runInContext(code, context);
  return context;
}
