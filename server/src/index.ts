import express from "express";
import cors from "cors";
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerUserRoutes } from './modules/users/routes.js'
import { registerProjectRoutes } from './modules/projects/routes.js'
import { registerCreativeRoutes } from './modules/creatives/routes.js'
import { registerVisualRoutes } from './modules/visuals/routes.js'
import { registerModelRoutes } from './modules/models/routes.js'
import { registerTeamRoutes } from './modules/team/routes.js'
import { hasDatabase } from './db/client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistDir = path.resolve(__dirname, '../../client/dist')

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

app.use(express.static(clientDistDir))
app.use((_req, res) => {
  res.sendFile(path.join(clientDistDir, 'index.html'))
})

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`d7-design-product server listening on :${port}`);
});
