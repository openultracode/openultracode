import { app } from "../src/app.js";

test("handles known routes", () => {
  expect(app.handleRequest("/health")).toBe("ok");
});
