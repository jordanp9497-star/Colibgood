import express from "express";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { listingsRouter } from "./routes/listings.js";
import { tripsRouter } from "./routes/trips.js";
import { proposalsRouter } from "./routes/proposals.js";
import { shipmentsRouter } from "./routes/shipments.js";
import { devicesRouter } from "./routes/devices.js";
import { notificationsRouter } from "./routes/notifications.js";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.use(healthRouter);
app.use(meRouter);
app.use(listingsRouter);
app.use(tripsRouter);
app.use(proposalsRouter);
app.use(shipmentsRouter);
app.use(devicesRouter);
app.use(notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
