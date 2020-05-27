import {
  serve,
  HTTPOptions,
  ServerRequest,
} from "https://deno.land/std@0.53.0/http/server.ts";
import { Request } from "./request.ts";
import { routeToRegExp } from "./pattern.ts";

export type Handler = (r: Request) => Promise<void> | void;

type Method = "GET" | "POST" | "PUT" | "DELETE";

export class Denosaur {
  private GET: [RegExp, Handler][] = [];
  private POST: [RegExp, Handler][] = [];
  private PUT: [RegExp, Handler][] = [];
  private DELETE: [RegExp, Handler][] = [];

  private addRoute(
    route: string | RegExp,
    handler: Handler,
    ...method: [RegExp, Handler][][]
  ): Denosaur {
    const r: [RegExp, Handler] = [
      typeof route === "string" ? routeToRegExp(route) : route,
      handler,
    ];
    method.forEach((m) => m.push(r));
    return this;
  }

  public get(route: string, handler: Handler): Denosaur {
    return this.addRoute(route, handler, this.GET);
  }

  public post(route: string, handler: Handler): Denosaur {
    return this.addRoute(route, handler, this.POST);
  }

  public put(route: string, handler: Handler): Denosaur {
    return this.addRoute(route, handler, this.PUT);
  }

  public delete(route: string, handler: Handler): Denosaur {
    return this.addRoute(route, handler, this.DELETE);
  }

  public all(route: string, handler: Handler): Denosaur {
    return this.addRoute(
      route,
      handler,
      this.GET,
      this.POST,
      this.PUT,
      this.DELETE,
    );
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
    const regex = routeToRegExp(route);
    if (get) {
      this.addRoute(regex, get, this.GET);
    }

    if (post) {
      this.addRoute(regex, post, this.POST);
    }

    if (put) {
      this.addRoute(regex, put, this.PUT);
    }

    if (del) {
      this.addRoute(regex, del, this.DELETE);
    }

    return this;
  }

  private handle(r: ServerRequest): Promise<void> | void {
    if (Array.isArray(this[r.method as Method])) {
      const url = new URL(r.url, `http://${r.headers.get("host")}`);
      const path = url.host + decodeURIComponent(url.pathname);
      const query = new URLSearchParams(url.search);

      for (const route of this[r.method as Method]) {
        const m = route[0].exec(path);
        if (m) {
          return route[1](new Request(r, m.groups ?? {}, query));
        }
      }
    }

    return new Request(r).error(404);
  }

  async listen(addr: string | HTTPOptions | number): Promise<void> {
    if (typeof addr === "number") {
      addr = { port: addr };
    }

    for await (const req of serve(addr)) {
      await this.handle(req);
    }
  }
}
