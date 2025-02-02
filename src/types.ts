export type RouteDefinition = {
  uri: string;
  name: string;
  action: string;
  domain: string | null;
  method: string;
  middleware: string[];
};