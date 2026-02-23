import app from "./app.js";
import { config } from "./config.js";

const host = "0.0.0.0";
app.listen(config.port, host, () => {
  console.log(`Colib API listening on http://${host}:${config.port}`);
});
