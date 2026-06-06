import { createRouter } from "./router.js";

export const app = createRouter({
  "/": "home",
  "/health": "ok"
});
