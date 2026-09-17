import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const root = fileURLToPath(new URL(".", import.meta.url));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url || "/", `http://${host}`).pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Bad request");
    return;
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  if (relativePath.split(/[\\/]/).some((segment) => segment.startsWith("."))) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }

  const filePath = resolve(root, relativePath);
  const rootRelative = relative(root, filePath);
  if (rootRelative.startsWith("..") || rootRelative.includes(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" }).end("Forbidden");
    return;
  }

  try {
    if (!statSync(filePath).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(filePath);
    stream.on("error", () => {
      if (!response.headersSent) response.writeHead(404);
      response.end("Not found");
    });
    stream.pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`ZIUI Tech preview: http://${host}:${port}/`);
});
