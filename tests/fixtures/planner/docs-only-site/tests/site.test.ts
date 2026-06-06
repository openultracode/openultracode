import { titleFor } from "../src/site.js";

test("returns the home title", () => {
  expect(titleFor("/")).toBe("Docs Only Site");
});
