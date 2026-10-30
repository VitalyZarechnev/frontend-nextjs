declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const content: string;

  export { ReactComponent };
  export default content;
}

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}
