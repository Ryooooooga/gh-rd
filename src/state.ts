export type State = Readonly<{
  tools: ReadonlyArray<ToolState>;
}>;

export type ToolState = Readonly<{
  name: `${string}/${string}`; // <user>/<repo>
  tag: string;
}>;
