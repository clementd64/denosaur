# Denosaur

Yet another web framework

## Work In Progress

```ts
import { Denosaur } from "https://deno.land/x/denosaur/mod.ts";

new Denosaur()
  .get("/", (r) => r.text("Hello World!"))
  .get("/ping", (r) => r.text("pong"))
  .get("/hello/:name", (r) => r.text(`Hello ${r.params.name}!`))
  .listen(8080);
```