/**
 * Custom Next.js server for cPanel / Passenger / Node.js App Selector.
 * Listens on process.env.PORT (required by most shared hosts) and optional HOST or LISTEN_HOST.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { applyNodeSecurityHeaders, requestIsHttps } = require("./src/lib/security/response-headers.cjs");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || process.env.LISTEN_HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const forwarded = req.headers["x-forwarded-proto"];
        const forwardedProto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        const https = requestIsHttps(forwardedProto, req.socket && req.socket.encrypted ? "https" : "");
        applyNodeSecurityHeaders(res, { https, dev });
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
