const { spawn } = require("child_process");

const isWindows = process.platform === "win32";

const run = (command, args, options = {}) =>
  spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    ...options,
  });

const runNpmStart = () => {
  if (isWindows) {
    return run("cmd.exe", ["/d", "/s", "/c", "npm start"]);
  }

  return run("npm", ["start"]);
};

const processes = [
  run(process.execPath, ["backend/server.js"]),
  runNpmStart(),
];

const stopAll = () => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
};

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});
