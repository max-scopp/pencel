/**
 * Metadata for a component property decorated with @Prop
 */
export interface PencilComponentPropMetadata {
  computedType: string;
  coerce: string | null;
}

/**
 * Complete metadata extracted from a component class decorated with @Component
 */
export interface PencilComponentMetadata {
  className: string;
  tagName?: string;
  states: string[];
  props: Map<string, PencilComponentPropMetadata>;
  styles: {
    defaultUrl?: string;
    modeUrls?: Record<string, string>;
    inline?: string[];
  };
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

export interface TransformResults {
  [filePath: string]: TransformResult;
}
