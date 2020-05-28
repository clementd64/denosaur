import { ServerRequest } from "https://deno.land/std@0.53.0/http/server.ts";
import { STATUS_TEXT } from "https://deno.land/std@0.52.0/http/http_status.ts";
import { Chunk } from "https://deno.land/x/file_chunk/mod.ts";

export class Request {
  readonly req: ServerRequest;
  readonly params: { [name: string]: string };
  readonly query: URLSearchParams;
  status: number = 200;
  headers: Headers = new Headers();

  private _finilized: boolean = false;
  get finilized(): boolean {
    return this._finilized;
  }

  constructor(
    req: ServerRequest,
    params: { [name: string]: string } = {},
    query: URLSearchParams = new URLSearchParams(),
  ) {
    this.req = req;
    this.params = params;
    this.query = query;
  }

  /** respond with a std/http compatible value */
  respond(body: Uint8Array | Deno.Reader | string): Promise<void> {
    this._finilized = true;
    return this.req.respond({
      status: this.status,
      headers: this.headers,
      body,
    }).catch(() => {});
  }

  /** respond with a plain value (set content-type to text/plain) */
  text(text: string): Promise<void> {
    this.headers.set("content-type", "text/plain; charset=utf8");
    return this.respond(text);
  }

  /** respond with a json value (set content-type to application/json) */
  json(json: any): Promise<void> {
    this.headers.set("content-type", "application/json; charset=utf8");
    return this.respond(JSON.stringify(json));
  }

  /** respond with a file (automatically set content-length) */
  async file(path: string): Promise<void> {
    this.headers.set("content-length", (await Deno.stat(path)).size.toString());
    return this.respond(await Deno.open(path));
  }

  /** respond with a partial content file (206 PARTIAL CONTENT)
   * use fileAutoPart for automatic request range detection */
  async filePart(path: string, start: number, end?: number): Promise<void> {
    const size = (await Deno.stat(path)).size;
    end = end ?? size - 1;

    this.status = 206;
    this.headers.set("accept-ranges", "bytes");
    this.headers.set("content-range", `bytes ${start}-${end}/${size}`);
    this.headers.set("content-length", (end - start + 1).toString());

    return this.respond(await Chunk.open(path, start, end));
  }

  /** repond with a file or partial content file if the client ask for a range */
  async fileAutoPart(path: string): Promise<void> {
    if (this.req.headers.get("range")?.startsWith("bytes=")) {
      const range = this.req.headers.get("range") as string;
      const parts = range.slice(6).split("-");

      const start = Number(parts[0] || 0);
      const end = parts[1] === "" ? undefined : Number(parts[1]);

      return this.filePart(path, start, end);
    } else {
      this.headers.set("accept-ranges", "bytes");
      return this.file(path);
    }
  }

  /** send a redirection
   * @param overwrite replace existing status and header */
  redirect(to: string, overwrite: boolean = true): Promise<void> {
    if (overwrite) {
      this.status = 301;
      this.headers = new Headers({ "location": to });
    } else {
      this.headers.set("location", to);
    }
    return this.respond("Redirect to " + to);
  }

  /** clear header and respond with a http status code */
  error(status: number) {
    this.status = status;
    this.headers = new Headers();
    return this.text(`${status} ${STATUS_TEXT.get(status)}`);
  }
}
