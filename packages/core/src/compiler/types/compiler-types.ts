export interface PencilConfig {
  compiler?: {
    target?:
      | "es5"
      | "es2015"
      | "es2017"
      | "es2018"
      | "es2019"
      | "es2020"
      | "es2021"
      | "es2022";
    experimentalDecorators?: boolean;
    emitDecoratorMetadata?: boolean;
  };
  output?: {
    dir?: string;
    format?: "esm" | "cjs";
  };
  tagNamespace?: string;
}

export interface ComponentMetadata {
  tagName?: string;
  selector?: string;
  extends?: string;
  tagNamespace?: string;
}

export interface TransformResult {
  code: string;
  metadata: ComponentMetadata;
}
