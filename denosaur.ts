import {
  serve,
  HTTPOptions,
  ServerRequest,
} from "https://deno.land/std@0.58.0/http/server.ts";
import { Request } from "./request.ts";
import { routeToRegExp } from "./pattern.ts";

export type Handler = (r: Request) => Promise<void> | void;

export class Denosaur {
  private _route: [RegExp, Handler[]][] = [];

  private addRoute(
    method: string,
    route: string,
    handler: Handler[],
  ): Denosaur {
    this._route.push([
      routeToRegExp(method, route),
      handler,
    ]);
    return this;
  }

  public get(route: string, ...handler: Handler[]): Denosaur {
    return this.addRoute("GET", route, handler);
  }

  public post(route: string, ...handler: Handler[]): Denosaur {
    return this.addRoute("POST", route, handler);
  }

  public put(route: string, ...handler: Handler[]): Denosaur {
    return this.addRoute("PUT", route, handler);
  }

  public delete(route: string, ...handler: Handler[]): Denosaur {
    return this.addRoute("DELETE", route, handler);
  }

  public all(route: string, handler: Handler): Denosaur {
    this.get(route, handler);
    this.post(route, handler);
    this.put(route, handler);
    this.delete(route, handler);
    return this;
  }

  public route(
    route: string,
    { get, post, put, delete: del }: {
      get?: Handler;
      post?: Handler;
      put?: Handler;
      delete?: Handler;
    },
  ): Denosaur {
    if (get) {
      this.get(route, get);
    }

    if (post) {
      this.post(route, post);
    }

    if (put) {
      this.put(route, put);
    }

    if (del) {
      this.delete(route, del);
    }

    return this;
  }

  private async handle(r: ServerRequest): Promise<void> {
    const url = new URL(r.url, `http://${r.headers.get("host")}`);
    const path = `${r.method}:${url.hostname}${
      decodeURIComponent(url.pathname)
    }`;
    const query = new URLSearchParams(url.search);

    for (const [pattern, handlers] of this._route) {
      const match = pattern.exec(path);
      if (match) {
        const request = new Request(r, match.groups ?? {}, query, match);
        for (const handler of handlers) {
          await handler(request);
          if (request.s.finilized) return;
        }
        if (!request.s.finilized) {
          return request.s.error(500);
        }
        return;
      }
    }

    return new Request(r).s.error(404);
  }

  async listen(addr: string | HTTPOptions | number): Promise<void> {
    if (typeof addr === "number") {
      addr = { port: addr };
    }

    for await (const req of serve(addr)) {
      this.handle(req).catch(() =>
        req.respond({
          status: 500,
          body: "500 Internal Server Error",
        }).catch(() => {})
      );
    }
  }
}
