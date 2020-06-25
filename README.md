# Denosaur

Yet another web framework

## Work In Progress

```ts
import { Denosaur } from "https://deno.land/x/denosaur/mod.ts";

new Denosaur()
  .get("/", (r) => r.s.text("Hello World!"))
  .get("/ping", (r) => r.s.text("pong"))
  .get("/hello/:name", (r) => r.s.text(`Hello ${r.params.name}!`))
  .listen(8080);
```