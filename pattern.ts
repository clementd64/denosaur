/** convert a route pattern to a RegExp */
export function routeToRegExp(route: string): RegExp {
  const firstSlash = route.indexOf("/");
  const host = firstSlash === -1 ? route : route.slice(0, firstSlash);
  const path = firstSlash === -1 ? "/**" : route.slice(firstSlash);

  return new RegExp(`^${
    host === "" ? "[^\/]*" : host
      .replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") // escape regex
      .replace(/\\\*\\\*/g, "([^\/]*)") // recusive wildcard
      .replace(/\\\*/g, "([^.\/]*)") // wildcard
  }${
    path
      .replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") // escape regex
      .replace(/#(\w+)/g, "(?<$1>\d+)") // named number capturing
      .replace(/:(\w+)/g, "(?<$1>[^\\/]+)") // named capturing
      .replace(/\\\*\\\*/g, "(.*)") // recusive wildcard
      .replace(/\\\*/g, "([^\/]*)") // wildcard
  }$`);
}
