import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import lookup from "./api/lookup.js";

const assets = {
  "/": ["index.html", "text/html"],
  "/app.js": ["app.js", "text/javascript"],
  "/style.css": ["style.css", "text/css"]
};

createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/api/lookup") {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 4096) {
        response.writeHead(413).end();
        return;
      }
    }
    try { request.body = JSON.parse(body); } catch { request.body = null; }
    return lookup(request, {
      setHeader: (key, value) => response.setHeader(key, value),
      status: status => ({
        json: data => response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(data))
      })
    });
  }

  const asset = assets[path];
  if (!Object.hasOwn(assets, path)) return response.writeHead(404).end();
  const [file, type] = asset;
  const contents = await readFile(new URL("./public/" + file, import.meta.url));
  response.writeHead(200, { "Content-Type": type + "; charset=utf-8" }).end(contents);
}).listen(4173, "127.0.0.1", () => console.log("http://127.0.0.1:4173"));
