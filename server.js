import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import morgan from "morgan";

// Keep Node's own fetch and streams. remix-serve installs polyfills that break
// Request headers and the AI SDK's response streams.
installGlobals({ nativeFetch: true });

const build = await import("./build/server/index.js");

const app = express();

app.disable("x-powered-by");
app.use(compression());
app.use(
	"/assets",
	express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
);
app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));

app.all("*", createRequestHandler({ build, mode: process.env.NODE_ENV }));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
