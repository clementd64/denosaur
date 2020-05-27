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

  public get(route: string, handler: Handler): Denosaur {
    this.GET.push([
      routeToRegExp(route),
      handler,
    ]);
    return this;
  }

  public post(route: string, handler: Handler): Denosaur {
    this.POST.push([
      routeToRegExp(route),
      handler,
    ]);
    return this;
  }

  public put(route: string, handler: Handler): Denosaur {
    this.PUT.push([
      routeToRegExp(route),
      handler,
    ]);
    return this;
  }

  public delete(route: string, handler: Handler): Denosaur {
    this.DELETE.push([
      routeToRegExp(route),
      handler,
    ]);
    return this;
  }

  public all(route: string, handler: Handler): Denosaur {
    const r: [RegExp, Handler] = [
      routeToRegExp(route),
      handler,
    ];
    this.GET.push(r);
    this.POST.push(r);
    this.PUT.push(r);
    this.DELETE.push(r);
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
    const regex = routeToRegExp(route);
    if (get) {
      this.GET.push([regex, get]);
    }

    if (post) {
      this.POST.push([regex, post]);
    }

    if (put) {
      this.PUT.push([regex, put]);
    }

    if (del) {
      this.DELETE.push([regex, del]);
    }

    return this;
  }

  private handle(r: ServerRequest): Promise<void> | void {
    if (Array.isArray(this[r.method as Method])) {
      const url = new URL(r.url, `http://${r.headers.get("host")}`);
      const path = url.host + decodeURIComponent(url.pathname);

      for (const route of this[r.method as Method]) {
        const m = route[0].exec(path);
        if (m) {
          return route[1](new Request(r, m.groups ?? {}));
        }
      }
    }

    return new Request(r, {}).error(404);
  }

  async listen(addr: string | HTTPOptions | number): Promise<void> {
    if (typeof addr === "number") {
      addr = { port: addr };
    }

    for await (const req of serve({ port: 80 })) {
      await this.handle(req);
    }
  }
}
