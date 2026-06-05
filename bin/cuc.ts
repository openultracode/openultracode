#!/usr/bin/env node
import { runCli } from "../src/cli.js";

const exitCode = await runCli(process.argv, {
  cwd: process.cwd(),
  stdout: (line) => {
    console.log(line);
  },
  stderr: (line) => {
    console.error(line);
  }
});

process.exitCode = exitCode;
