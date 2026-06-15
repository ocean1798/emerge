import { publicConfig } from "./config.js";

console.log(
  JSON.stringify(
    {
      ok: true,
      providers: publicConfig(),
    },
    null,
    2,
  ),
);
