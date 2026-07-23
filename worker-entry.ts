import { setD1 } from "./db";
import {
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
} from "./app/api/vault/route";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

function methodNotAllowed() {
  return Response.json(
    { error: "不支持这种请求方式。" },
    {
      status: 405,
      headers: {
        Allow: "GET, POST, PUT, PATCH, OPTIONS",
        "Cache-Control": "no-store",
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/vault" || url.pathname === "/api/vault/") {
      setD1(env.DB);

      switch (request.method.toUpperCase()) {
        case "OPTIONS":
          return OPTIONS();
        case "GET":
          return GET(request);
        case "PUT":
          return PUT(request);
        case "POST":
          return POST(request);
        case "PATCH":
          return PATCH(request);
        default:
          return methodNotAllowed();
      }
    }

    return env.ASSETS.fetch(request);
  },
};
