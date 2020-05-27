/** convert a route pattern to a RegExp */
export function routeToRegExp(route: string): RegExp {
  const firstSlash = route.indexOf("/");
  const host = route.slice(0, firstSlash);
  const path = route.slice(firstSlash);

  return new RegExp(`^${
    host === "" ? "[^\/]*" : host
      .replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") // escape regex
      .replace(/\\\*\\\*/g, "([^\/]+)") // recusive wildcard
      .replace(/\\\*/g, "([^.\/]+)") // wildcard
  }${
    path
      .replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") // escape regex
      .replace(/#(\w+)/g, "(?<$1>\d+)") // named number capturing
      .replace(/:(\w+)/g, "(?<$1>[^\\/]+)") // named capturing
      .replace(/\\\*\\\*/g, "(.+)") // recusive wildcard
      .replace(/\\\*/g, "([^\/]+)") // wildcard
  }$`);
}
