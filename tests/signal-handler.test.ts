import { EventEmitter } from "node:events";

import { installSignalHandlers } from "../src/signal-handler.js";

test("installSignalHandlers aborts a controller on SIGINT and cleans up listeners", () => {
  const processLike = new EventEmitter();
  const controller = new AbortController();

  const cleanup = installSignalHandlers(processLike, controller);

  expect(processLike.listenerCount("SIGINT")).toBe(1);
  expect(processLike.listenerCount("SIGTERM")).toBe(1);

  processLike.emit("SIGINT");

  expect(controller.signal.aborted).toBe(true);
  expect(controller.signal.reason).toBe("SIGINT");
  expect(processLike.listenerCount("SIGINT")).toBe(0);
  expect(processLike.listenerCount("SIGTERM")).toBe(0);

  cleanup();
  expect(processLike.listenerCount("SIGINT")).toBe(0);
  expect(processLike.listenerCount("SIGTERM")).toBe(0);
});
