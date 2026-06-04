import express from "express";
import { createServer as createViteServer } from "vite";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth/index.js";

const app = express();
const PORT = parseInt(process.env.PORT || "5000");
const isDev = process.env.NODE_ENV !== "production";

app.use(express.json());

async function start() {
  await setupAuth(app);
  registerAuthRoutes(app);

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const { default: sirv } = await import("sirv");
    app.use(sirv("dist", { single: true }));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
