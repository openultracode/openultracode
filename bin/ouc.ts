#!/usr/bin/env node
import { runCli } from "../src/cli.js";
import { installSignalHandlers } from "../src/signal-handler.js";

const abortController = new AbortController();
const cleanupSignalHandlers = installSignalHandlers(process, abortController);

try {
  const exitCode = await runCli(process.argv, {
    cwd: process.cwd(),
    abortSignal: abortController.signal,
    stdout: (line) => {
      console.log(line);
    },
    stderr: (line) => {
      console.error(line);
    }
  });

  process.exitCode = exitCode;
} finally {
  cleanupSignalHandlers();
}
