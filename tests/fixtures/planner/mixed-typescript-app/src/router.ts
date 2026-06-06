export type RouteTable = Record<string, string>;

export function createRouter(routes: RouteTable) {
  return {
    handleRequest(path: string): string {
      return routes[path] ?? "not-found";
    }
  };
}
