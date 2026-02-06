import { execSync } from "child_process";

console.log("Building Next.js application...");
execSync("npx next build", { stdio: "inherit" });
console.log("Build complete!");
