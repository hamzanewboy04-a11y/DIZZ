import express from "express";
import cors from "cors";
import { registerUserRoutes } from './modules/users/routes.js'
import { registerProjectRoutes } from './modules/projects/routes.js'
import { registerCreativeRoutes } from './modules/creatives/routes.js'
import { registerVisualRoutes } from './modules/visuals/routes.js'
import { registerModelRoutes } from './modules/models/routes.js'
import { registerTeamRoutes } from './modules/team/routes.js'
import { hasDatabase } from './db/client.js'

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, product: "d7-design-product", database: hasDatabase() ? 'configured' : 'mock-only' });
});

registerUserRoutes(app)
registerProjectRoutes(app)
registerCreativeRoutes(app)
registerVisualRoutes(app)
registerModelRoutes(app)
registerTeamRoutes(app)

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`d7-design-product server listening on :${port}`);
});
