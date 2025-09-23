declare namespace LocalJSX {
  type Element = {};
  type IntrinsicElements = {};
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends JSXBase.IntrinsicElements {}
  }

  // TODO: Better types needed
  type JSXElementAttributes<T> = Partial<T>;
}

export declare namespace JSXBase {
  interface IntrinsicElements {
    slot: JSXBase.SlotAttributes;
    a: JSXBase.AnchorHTMLAttributes<HTMLAnchorElement>;
    abbr: JSXBase.HTMLAttributes;
    address: JSXBase.HTMLAttributes;
    area: JSXBase.AreaHTMLAttributes<HTMLAreaElement>;
    article: JSXBase.HTMLAttributes;
    aside: JSXBase.HTMLAttributes;
    audio: JSXBase.AudioHTMLAttributes<HTMLAudioElement>;
    b: JSXBase.HTMLAttributes;
    base: JSXBase.BaseHTMLAttributes<HTMLBaseElement>;
    bdi: JSXBase.HTMLAttributes;
    bdo: JSXBase.HTMLAttributes;
    big: JSXBase.HTMLAttributes;
    blockquote: JSXBase.BlockquoteHTMLAttributes<HTMLQuoteElement>;
    body: JSXBase.HTMLAttributes<HTMLBodyElement>;
    br: JSXBase.HTMLAttributes<HTMLBRElement>;
    button: JSXBase.ButtonHTMLAttributes<HTMLButtonElement>;
    canvas: JSXBase.CanvasHTMLAttributes<HTMLCanvasElement>;
    caption: JSXBase.HTMLAttributes<HTMLTableCaptionElement>;
    cite: JSXBase.HTMLAttributes;
    code: JSXBase.HTMLAttributes;
    col: JSXBase.ColHTMLAttributes<HTMLTableColElement>;
    colgroup: JSXBase.ColgroupHTMLAttributes<HTMLTableColElement>;
    data: JSXBase.HTMLAttributes<HTMLDataElement>;
    datalist: JSXBase.HTMLAttributes<HTMLDataListElement>;
    dd: JSXBase.HTMLAttributes;
    del: JSXBase.DelHTMLAttributes<HTMLModElement>;
    details: JSXBase.DetailsHTMLAttributes<HTMLElement>;
    dfn: JSXBase.HTMLAttributes;
    dialog: JSXBase.DialogHTMLAttributes<HTMLDialogElement>;
    div: JSXBase.HTMLAttributes<HTMLDivElement>;
    dl: JSXBase.HTMLAttributes<HTMLDListElement>;
    dt: JSXBase.HTMLAttributes;
    em: JSXBase.HTMLAttributes;
    embed: JSXBase.EmbedHTMLAttributes<HTMLEmbedElement>;
    fieldset: JSXBase.FieldsetHTMLAttributes<HTMLFieldSetElement>;
    figcaption: JSXBase.HTMLAttributes;
    figure: JSXBase.HTMLAttributes;
    footer: JSXBase.HTMLAttributes;
    form: JSXBase.FormHTMLAttributes<HTMLFormElement>;
    h1: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h2: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h3: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h4: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h5: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h6: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    head: JSXBase.HTMLAttributes<HTMLHeadElement>;
    header: JSXBase.HTMLAttributes;
    hgroup: JSXBase.HTMLAttributes;
    hr: JSXBase.HTMLAttributes<HTMLHRElement>;
    html: JSXBase.HTMLAttributes<HTMLHtmlElement>;
    i: JSXBase.HTMLAttributes;
    iframe: JSXBase.IframeHTMLAttributes<HTMLIFrameElement>;
    img: JSXBase.ImgHTMLAttributes<HTMLImageElement>;
    input: JSXBase.InputHTMLAttributes<HTMLInputElement>;
    ins: JSXBase.InsHTMLAttributes<HTMLModElement>;
    kbd: JSXBase.HTMLAttributes;
    keygen: JSXBase.KeygenHTMLAttributes<HTMLElement>;
    label: JSXBase.LabelHTMLAttributes<HTMLLabelElement>;
    legend: JSXBase.HTMLAttributes<HTMLLegendElement>;
    li: JSXBase.LiHTMLAttributes<HTMLLIElement>;
    link: JSXBase.LinkHTMLAttributes<HTMLLinkElement>;
    main: JSXBase.HTMLAttributes;
    map: JSXBase.MapHTMLAttributes<HTMLMapElement>;
    mark: JSXBase.HTMLAttributes;
    menu: JSXBase.MenuHTMLAttributes<HTMLMenuElement>;
    menuitem: JSXBase.HTMLAttributes;
    meta: JSXBase.MetaHTMLAttributes<HTMLMetaElement>;
    meter: JSXBase.MeterHTMLAttributes<HTMLMeterElement>;
    nav: JSXBase.HTMLAttributes;
    noscript: JSXBase.HTMLAttributes;
    object: JSXBase.ObjectHTMLAttributes<HTMLObjectElement>;
    ol: JSXBase.OlHTMLAttributes<HTMLOListElement>;
    optgroup: JSXBase.OptgroupHTMLAttributes<HTMLOptGroupElement>;
    option: JSXBase.OptionHTMLAttributes<HTMLOptionElement>;
    output: JSXBase.OutputHTMLAttributes<HTMLOutputElement>;
    p: JSXBase.HTMLAttributes<HTMLParagraphElement>;
    param: JSXBase.ParamHTMLAttributes<HTMLParamElement>;
    picture: JSXBase.HTMLAttributes<HTMLPictureElement>;
    pre: JSXBase.HTMLAttributes<HTMLPreElement>;
    progress: JSXBase.ProgressHTMLAttributes<HTMLProgressElement>;
    q: JSXBase.QuoteHTMLAttributes<HTMLQuoteElement>;
    rp: JSXBase.HTMLAttributes;
    rt: JSXBase.HTMLAttributes;
    ruby: JSXBase.HTMLAttributes;
    s: JSXBase.HTMLAttributes;
    samp: JSXBase.HTMLAttributes;
    script: JSXBase.ScriptHTMLAttributes<HTMLScriptElement>;
    section: JSXBase.HTMLAttributes;
    select: JSXBase.SelectHTMLAttributes<HTMLSelectElement>;
    small: JSXBase.HTMLAttributes;
    source: JSXBase.SourceHTMLAttributes<HTMLSourceElement>;
    span: JSXBase.HTMLAttributes<HTMLSpanElement>;
    strong: JSXBase.HTMLAttributes;
    style: JSXBase.StyleHTMLAttributes<HTMLStyleElement>;
    sub: JSXBase.HTMLAttributes;
    summary: JSXBase.HTMLAttributes;
    sup: JSXBase.HTMLAttributes;
    table: JSXBase.TableHTMLAttributes<HTMLTableElement>;
    tbody: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    td: JSXBase.TdHTMLAttributes<HTMLTableDataCellElement>;
    textarea: JSXBase.TextareaHTMLAttributes<HTMLTextAreaElement>;
    tfoot: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    th: JSXBase.ThHTMLAttributes<HTMLTableHeaderCellElement>;
    thead: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    time: JSXBase.TimeHTMLAttributes<HTMLTimeElement>;
    title: JSXBase.HTMLAttributes<HTMLTitleElement>;
    tr: JSXBase.HTMLAttributes<HTMLTableRowElement>;
    track: JSXBase.TrackHTMLAttributes<HTMLTrackElement>;
    u: JSXBase.HTMLAttributes;
    ul: JSXBase.HTMLAttributes<HTMLUListElement>;
    var: JSXBase.HTMLAttributes;
    video: JSXBase.VideoHTMLAttributes<HTMLVideoElement>;
    wbr: JSXBase.HTMLAttributes;
    animate: JSXBase.SVGAttributes;
    circle: JSXBase.SVGAttributes;
    clipPath: JSXBase.SVGAttributes;
    defs: JSXBase.SVGAttributes;
    desc: JSXBase.SVGAttributes;
    ellipse: JSXBase.SVGAttributes;
    feBlend: JSXBase.SVGAttributes;
    feColorMatrix: JSXBase.SVGAttributes;
    feComponentTransfer: JSXBase.SVGAttributes;
    feComposite: JSXBase.SVGAttributes;
    feConvolveMatrix: JSXBase.SVGAttributes;
    feDiffuseLighting: JSXBase.SVGAttributes;
    feDisplacementMap: JSXBase.SVGAttributes;
    feDistantLight: JSXBase.SVGAttributes;
    feDropShadow: JSXBase.SVGAttributes;
    feFlood: JSXBase.SVGAttributes;
    feFuncA: JSXBase.SVGAttributes;
    feFuncB: JSXBase.SVGAttributes;
    feFuncG: JSXBase.SVGAttributes;
    feFuncR: JSXBase.SVGAttributes;
    feGaussianBlur: JSXBase.SVGAttributes;
    feImage: JSXBase.SVGAttributes;
    feMerge: JSXBase.SVGAttributes;
    feMergeNode: JSXBase.SVGAttributes;
    feMorphology: JSXBase.SVGAttributes;
    feOffset: JSXBase.SVGAttributes;
    fePointLight: JSXBase.SVGAttributes;
    feSpecularLighting: JSXBase.SVGAttributes;
    feSpotLight: JSXBase.SVGAttributes;
    feTile: JSXBase.SVGAttributes;
    feTurbulence: JSXBase.SVGAttributes;
    filter: JSXBase.SVGAttributes;
    foreignObject: JSXBase.SVGAttributes;
    g: JSXBase.SVGAttributes;
    image: JSXBase.SVGAttributes;
    line: JSXBase.SVGAttributes;
    linearGradient: JSXBase.SVGAttributes;
    marker: JSXBase.SVGAttributes;
    mask: JSXBase.SVGAttributes;
    metadata: JSXBase.SVGAttributes;
    path: JSXBase.SVGAttributes;
    pattern: JSXBase.SVGAttributes;
    polygon: JSXBase.SVGAttributes;
    polyline: JSXBase.SVGAttributes;
    radialGradient: JSXBase.SVGAttributes;
    rect: JSXBase.SVGAttributes;
    stop: JSXBase.SVGAttributes;
    svg: JSXBase.SVGAttributes;
    switch: JSXBase.SVGAttributes;
    symbol: JSXBase.SVGAttributes;
    text: JSXBase.SVGAttributes;
    textPath: JSXBase.SVGAttributes;
    tspan: JSXBase.SVGAttributes;
    use: JSXBase.SVGAttributes;
    view: JSXBase.SVGAttributes;
  }
  interface SlotAttributes extends JSXAttributes {
    name?: string;
    slot?: string;
    onSlotchange?: (event: Event) => void;
  }
  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: any;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    media?: string;
    ping?: string;
    rel?: string;
    target?: string;
    referrerPolicy?: ReferrerPolicy;
  }
  interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}
  interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    coords?: string;
    download?: any;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    media?: string;
    rel?: string;
    shape?: string;
    target?: string;
  }
  interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
    href?: string;
    target?: string;
  }
  interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formaction?: string;
    formEncType?: string;
    formenctype?: string;
    formMethod?: string;
    formmethod?: string;
    formNoValidate?: boolean;
    formnovalidate?: boolean;
    formTarget?: string;
    formtarget?: string;
    name?: string;
    type?: string;
    value?: string | string[] | number;
    popoverTargetAction?: string;
    popoverTargetElement?: Element | null;
    popoverTarget?: string;
  }
  interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    width?: number | string;
  }
  interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number;
  }
  interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number;
  }
  interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: boolean;
    name?: string;
    onToggle?: (event: ToggleEvent) => void;
  }
  interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
    dateTime?: string;
    datetime?: string;
  }
  interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
    onCancel?: (event: Event) => void;
    onClose?: (event: Event) => void;
    open?: boolean;
    returnValue?: string;
  }
  interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    src?: string;
    type?: string;
    width?: number | string;
  }
  interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    name?: string;
  }
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    acceptCharset?: string;
    acceptcharset?: string;
    action?: string;
    autoComplete?: string;
    autocomplete?: string;
    encType?: string;
    enctype?: string;
    method?: string;
    name?: string;
    noValidate?: boolean;
    novalidate?: boolean | string;
    target?: string;
  }
  interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
    manifest?: string;
  }
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allow?: string;
    allowFullScreen?: boolean;
    allowfullScreen?: string | boolean;
    allowTransparency?: boolean;
    allowtransparency?: string | boolean;
    frameBorder?: number | string;
    frameborder?: number | string;
    importance?: "low" | "auto" | "high";
    height?: number | string;
    loading?: "lazy" | "auto" | "eager";
    marginHeight?: number;
    marginheight?: string | number;
    marginWidth?: number;
    marginwidth?: string | number;
    name?: string;
    referrerPolicy?: ReferrerPolicy;
    sandbox?: string;
    scrolling?: string;
    seamless?: boolean;
    src?: string;
    srcDoc?: string;
    srcdoc?: string;
    width?: number | string;
  }
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    crossOrigin?: string;
    crossorigin?: string;
    decoding?: "async" | "auto" | "sync";
    importance?: "low" | "auto" | "high";
    height?: number | string;
    loading?: "lazy" | "auto" | "eager";
    sizes?: string;
    src?: string;
    srcSet?: string;
    srcset?: string;
    useMap?: string;
    usemap?: string;
    width?: number | string;
  }
  interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
    dateTime?: string;
    datetime?: string;
  }
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    allowdirs?: boolean;
    alt?: string;
    autoCapitalize?: string;
    autocapitalize?: string;
    autoComplete?: string;
    autocomplete?: string;
    capture?: string;
    checked?: boolean;
    crossOrigin?: string;
    crossorigin?: string;
    defaultChecked?: boolean;
    defaultValue?: string;
    dirName?: string;
    disabled?: boolean;
    files?: any;
    form?: string;
    formAction?: string;
    formaction?: string;
    formEncType?: string;
    formenctype?: string;
    formMethod?: string;
    formmethod?: string;
    formNoValidate?: boolean;
    formnovalidate?: boolean;
    formTarget?: string;
    formtarget?: string;
    height?: number | string;
    indeterminate?: boolean;
    list?: string;
    max?: number | string;
    maxLength?: number;
    maxlength?: number | string;
    min?: number | string;
    minLength?: number;
    minlength?: number | string;
    multiple?: boolean;
    name?: string;
    onSelect?: (event: Event) => void;
    onselect?: (event: Event) => void;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    readonly?: boolean | string;
    required?: boolean;
    selectionStart?: number | string;
    selectionEnd?: number | string;
    selectionDirection?: string;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | string[] | number;
    valueAsDate?: any;
    valueAsNumber?: any;
    webkitdirectory?: boolean;
    webkitEntries?: any;
    width?: number | string;
    popoverTargetAction?: string;
    popoverTargetElement?: Element | null;
    popoverTarget?: string;
  }
  interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
    challenge?: string;
    disabled?: boolean;
    form?: string;
    keyType?: string;
    keytype?: string;
    keyParams?: string;
    keyparams?: string;
    name?: string;
  }
  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    htmlFor?: string;
  }
  interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | string[] | number;
  }
  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    as?: string;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    importance?: "low" | "auto" | "high";
    integrity?: string;
    media?: string;
    rel?: string;
    sizes?: string;
    type?: string;
  }
  interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
  }
  interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: string;
  }
  interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoPlay?: boolean;
    autoplay?: boolean | string;
    controls?: boolean;
    controlslist?: "nodownload" | "nofullscreen" | "noremoteplayback";
    controlsList?: "nodownload" | "nofullscreen" | "noremoteplayback";
    crossOrigin?: string;
    crossorigin?: string;
    loop?: boolean;
    mediaGroup?: string;
    mediagroup?: string;
    muted?: boolean;
    preload?: string;
    src?: string;
    onAbort?: (event: Event) => void;
    onCanPlay?: (event: Event) => void;
    onCanPlayThrough?: (event: Event) => void;
    onDurationChange?: (event: Event) => void;
    onEmptied?: (event: Event) => void;
    onEnded?: (event: Event) => void;
    onError?: (event: Event) => void;
    onInterruptBegin?: (event: Event) => void;
    onInterruptEnd?: (event: Event) => void;
    onLoadedData?: (event: Event) => void;
    onLoadedMetaData?: (event: Event) => void;
    onLoadStart?: (event: Event) => void;
    onMozAudioAvailable?: (event: Event) => void;
    onPause?: (event: Event) => void;
    onPlay?: (event: Event) => void;
    onPlaying?: (event: Event) => void;
    onProgress?: (event: Event) => void;
    onRateChange?: (event: Event) => void;
    onSeeked?: (event: Event) => void;
    onSeeking?: (event: Event) => void;
    onStalled?: (event: Event) => void;
    onSuspend?: (event: Event) => void;
    onTimeUpdate?: (event: Event) => void;
    onVolumeChange?: (event: Event) => void;
    onWaiting?: (event: Event) => void;
  }
  interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
    charSet?: string;
    charset?: string;
    content?: string;
    httpEquiv?: string;
    httpequiv?: string;
    name?: string;
  }
  interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    high?: number;
    low?: number;
    max?: number | string;
    min?: number | string;
    optimum?: number;
    value?: string | string[] | number;
  }
  interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }
  interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
    classID?: string;
    classid?: string;
    data?: string;
    form?: string;
    height?: number | string;
    name?: string;
    type?: string;
    useMap?: string;
    usemap?: string;
    width?: number | string;
    wmode?: string;
  }
  interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    reversed?: boolean;
    start?: number;
  }
  interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
  }
  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
    selected?: boolean;
    value?: string | string[] | number;
  }
  interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    htmlFor?: string;
    name?: string;
  }
  interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
    value?: string | string[] | number;
  }
  interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
    max?: number | string;
    value?: string | string[] | number;
  }
  interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
    async?: boolean;
    charSet?: string;
    charset?: string;
    crossOrigin?: string;
    crossorigin?: string;
    defer?: boolean;
    importance?: "low" | "auto" | "high";
    integrity?: string;
    nonce?: string;
    src?: string;
    type?: string;
  }
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    multiple?: boolean;
    name?: string;
    required?: boolean;
    size?: number;
    autoComplete?: string;
    autocomplete?: string;
  }
  interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number;
    media?: string;
    sizes?: string;
    src?: string;
    srcSet?: string;
    type?: string;
    width?: number;
  }
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: string;
    nonce?: string;
    scoped?: boolean;
    type?: string;
  }
  interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
    cellPadding?: number | string;
    cellpadding?: number | string;
    cellSpacing?: number | string;
    cellspacing?: number | string;
    summary?: string;
  }
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    autocomplete?: string;
    cols?: number;
    disabled?: boolean;
    form?: string;
    maxLength?: number;
    maxlength?: number | string;
    minLength?: number;
    minlength?: number | string;
    name?: string;
    onSelect?: (event: Event) => void;
    onselect?: (event: Event) => void;
    placeholder?: string;
    readOnly?: boolean;
    readonly?: boolean | string;
    required?: boolean;
    rows?: number;
    value?: string | string[] | number;
    wrap?: string;
  }
  interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
  }
  interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    abbr?: string;
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
    rowspan?: number | string;
    scope?: string;
  }
  interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
    dateTime?: string;
  }
  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    default?: boolean;
    kind?: string;
    label?: string;
    src?: string;
    srcLang?: string;
    srclang?: string;
  }
  interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: number | string;
    playsInline?: boolean;
    playsinline?: boolean | string;
    poster?: string;
    width?: number | string;
  }
  interface HTMLAttributes<T = HTMLElement> extends DOMAttributes<T> {
    innerHTML?: string;
    accessKey?: string;
    autoFocus?: boolean;
    autofocus?: boolean | string;
    class?:
      | string
      | {
          [className: string]: boolean;
        };
    contentEditable?: boolean | string;
    contenteditable?: boolean | string;
    contextMenu?: string;
    contextmenu?: string;
    dir?: string;
    draggable?: boolean;
    hidden?: boolean;
    id?: string;
    inert?: boolean;
    lang?: string;
    spellcheck?: "true" | "false" | any;
    style?: {
      [key: string]: string | undefined;
    };
    tabIndex?: number;
    tabindex?: number | string;
    title?: string;
    popover?: string | null;
    inputMode?: string;
    inputmode?: string;
    enterKeyHint?: string;
    enterkeyhint?: string;
    is?: string;
    radioGroup?: string;
    radiogroup?: string;
    role?: string;
    about?: string;
    datatype?: string;
    inlist?: any;
    prefix?: string;
    property?: string;
    resource?: string;
    typeof?: string;
    vocab?: string;
    autoCapitalize?: string;
    autocapitalize?: string;
    autoCorrect?: string;
    autocorrect?: string;
    autoSave?: string;
    autosave?: string;
    color?: string;
    itemProp?: string;
    itemprop?: string;
    itemScope?: boolean;
    itemscope?: boolean;
    itemType?: string;
    itemtype?: string;
    itemID?: string;
    itemid?: string;
    itemRef?: string;
    itemref?: string;
    results?: number;
    security?: string;
    unselectable?: boolean;
  }
  interface SVGAttributes<T = SVGElement> extends DOMAttributes<T> {
    class?:
      | string
      | {
          [className: string]: boolean;
        };
    color?: string;
    height?: number | string;
    id?: string;
    lang?: string;
    max?: number | string;
    media?: string;
    method?: string;
    min?: number | string;
    name?: string;
    style?: {
      [key: string]: string | undefined;
    };
    target?: string;
    type?: string;
    width?: number | string;
    role?: string;
    tabindex?: number;
    "accent-height"?: number | string;
    accumulate?: "none" | "sum";
    additive?: "replace" | "sum";
    "alignment-baseline"?:
      | "auto"
      | "baseline"
      | "before-edge"
      | "text-before-edge"
      | "middle"
      | "central"
      | "after-edge"
      | "text-after-edge"
      | "ideographic"
      | "alphabetic"
      | "hanging"
      | "mathematical"
      | "inherit";
    allowReorder?: "no" | "yes";
    alphabetic?: number | string;
    amplitude?: number | string;
    "arabic-form"?: "initial" | "medial" | "terminal" | "isolated";
    ascent?: number | string;
    attributeName?: string;
    attributeType?: string;
    autoReverse?: number | string;
    azimuth?: number | string;
    baseFrequency?: number | string;
    "baseline-shift"?: number | string;
    baseProfile?: number | string;
    bbox?: number | string;
    begin?: number | string;
    bias?: number | string;
    by?: number | string;
    calcMode?: number | string;
    "cap-height"?: number | string;
    clip?: number | string;
    "clip-path"?: string;
    clipPathUnits?: number | string;
    "clip-rule"?: number | string;
    "color-interpolation"?: number | string;
    "color-interpolation-filters"?: "auto" | "sRGB" | "linearRGB";
    "color-profile"?: number | string;
    "color-rendering"?: number | string;
    contentScriptType?: number | string;
    contentStyleType?: number | string;
    cursor?: number | string;
    cx?: number | string;
    cy?: number | string;
    d?: string;
    decelerate?: number | string;
    descent?: number | string;
    diffuseConstant?: number | string;
    direction?: number | string;
    display?: number | string;
    divisor?: number | string;
    "dominant-baseline"?: number | string;
    dur?: number | string;
    dx?: number | string;
    dy?: number | string;
    "edge-mode"?: number | string;
    elevation?: number | string;
    "enable-background"?: number | string;
    end?: number | string;
    exponent?: number | string;
    externalResourcesRequired?: number | string;
    fill?: string;
    "fill-opacity"?: number | string;
    "fill-rule"?: "nonzero" | "evenodd" | "inherit";
    filter?: string;
    filterRes?: number | string;
    filterUnits?: number | string;
    "flood-color"?: number | string;
    "flood-opacity"?: number | string;
    focusable?: number | string;
    "font-family"?: string;
    "font-size"?: number | string;
    "font-size-adjust"?: number | string;
    "font-stretch"?: number | string;
    "font-style"?: number | string;
    "font-variant"?: number | string;
    "font-weight"?: number | string;
    format?: number | string;
    from?: number | string;
    fx?: number | string;
    fy?: number | string;
    g1?: number | string;
    g2?: number | string;
    "glyph-name"?: number | string;
    "glyph-orientation-horizontal"?: number | string;
    "glyph-orientation-vertical"?: number | string;
    glyphRef?: number | string;
    gradientTransform?: string;
    gradientUnits?: string;
    hanging?: number | string;
    "horiz-adv-x"?: number | string;
    "horiz-origin-x"?: number | string;
    href?: string;
    ideographic?: number | string;
    "image-rendering"?: number | string;
    in2?: number | string;
    in?: string;
    intercept?: number | string;
    k1?: number | string;
    k2?: number | string;
    k3?: number | string;
    k4?: number | string;
    k?: number | string;
    kernelMatrix?: number | string;
    kernelUnitLength?: number | string;
    kerning?: number | string;
    keyPoints?: number | string;
    keySplines?: number | string;
    keyTimes?: number | string;
    lengthAdjust?: number | string;
    "letter-spacing"?: number | string;
    "lighting-color"?: number | string;
    limitingConeAngle?: number | string;
    local?: number | string;
    "marker-end"?: string;
    markerHeight?: number | string;
    "marker-mid"?: string;
    "marker-start"?: string;
    markerUnits?: number | string;
    markerWidth?: number | string;
    mask?: string;
    maskContentUnits?: number | string;
    maskUnits?: number | string;
    mathematical?: number | string;
    mode?: number | string;
    numOctaves?: number | string;
    offset?: number | string;
    opacity?: number | string;
    operator?: number | string;
    order?: number | string;
    orient?: number | string;
    orientation?: number | string;
    origin?: number | string;
    overflow?: number | string;
    "overline-position"?: number | string;
    "overline-thickness"?: number | string;
    "paint-order"?: number | string;
    panose1?: number | string;
    pathLength?: number | string;
    patternContentUnits?: string;
    patternTransform?: number | string;
    patternUnits?: string;
    "pointer-events"?: number | string;
    points?: string;
    pointsAtX?: number | string;
    pointsAtY?: number | string;
    pointsAtZ?: number | string;
    preserveAlpha?: number | string;
    preserveAspectRatio?: string;
    primitiveUnits?: number | string;
    r?: number | string;
    radius?: number | string;
    refX?: number | string;
    refY?: number | string;
    "rendering-intent"?: number | string;
    repeatCount?: number | string;
    repeatDur?: number | string;
    requiredextensions?: number | string;
    requiredFeatures?: number | string;
    restart?: number | string;
    result?: string;
    rotate?: number | string;
    rx?: number | string;
    ry?: number | string;
    scale?: number | string;
    seed?: number | string;
    "shape-rendering"?: number | string;
    slope?: number | string;
    spacing?: number | string;
    specularConstant?: number | string;
    specularExponent?: number | string;
    speed?: number | string;
    spreadMethod?: string;
    startOffset?: number | string;
    stdDeviation?: number | string;
    stemh?: number | string;
    stemv?: number | string;
    stitchTiles?: number | string;
    "stop-color"?: string;
    "stop-opacity"?: number | string;
    "strikethrough-position"?: number | string;
    "strikethrough-thickness"?: number | string;
    string?: number | string;
    stroke?: string;
    "stroke-dasharray"?: string | number;
    "stroke-dashoffset"?: string | number;
    "stroke-linecap"?: "butt" | "round" | "square" | "inherit";
    "stroke-linejoin"?: "miter" | "round" | "bevel" | "inherit";
    "stroke-miterlimit"?: string;
    "stroke-opacity"?: number | string;
    "stroke-width"?: number | string;
    surfaceScale?: number | string;
    systemLanguage?: number | string;
    tableValues?: number | string;
    targetX?: number | string;
    targetY?: number | string;
    "text-anchor"?: string;
    "text-decoration"?: number | string;
    textLength?: number | string;
    "text-rendering"?: number | string;
    to?: number | string;
    transform?: string;
    u1?: number | string;
    u2?: number | string;
    "underline-position"?: number | string;
    "underline-thickness"?: number | string;
    unicode?: number | string;
    "unicode-bidi"?: number | string;
    "unicode-range"?: number | string;
    "units-per-em"?: number | string;
    "v-alphabetic"?: number | string;
    values?: string;
    "vector-effect"?: number | string;
    version?: string;
    "vert-adv-y"?: number | string;
    "vert-origin-x"?: number | string;
    "vert-origin-y"?: number | string;
    "v-hanging"?: number | string;
    "v-ideographic"?: number | string;
    viewBox?: string;
    viewTarget?: number | string;
    visibility?: number | string;
    "v-mathematical"?: number | string;
    widths?: number | string;
    "word-spacing"?: number | string;
    "writing-mode"?: number | string;
    x1?: number | string;
    x2?: number | string;
    x?: number | string;
    "x-channel-selector"?: string;
    "x-height"?: number | string;
    xlinkActuate?: string;
    xlinkArcrole?: string;
    xlinkHref?: string;
    xlinkRole?: string;
    xlinkShow?: string;
    xlinkTitle?: string;
    xlinkType?: string;
    xmlBase?: string;
    xmlLang?: string;
    xmlns?: string;
    xmlSpace?: string;
    y1?: number | string;
    y2?: number | string;
    y?: number | string;
    yChannelSelector?: string;
    z?: number | string;
    zoomAndPan?: string;
  }
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent) */
  interface ToggleEvent extends Event {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent/newState) */
    readonly newState: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent/oldState) */
    readonly oldState: string;
  }
  interface DOMAttributes<T> extends JSXAttributes<T> {
    slot?: string;
    part?: string;
    exportparts?: string;
    onCopy?: (event: ClipboardEvent) => void;
    onCopyCapture?: (event: ClipboardEvent) => void;
    onCut?: (event: ClipboardEvent) => void;
    onCutCapture?: (event: ClipboardEvent) => void;
    onPaste?: (event: ClipboardEvent) => void;
    onPasteCapture?: (event: ClipboardEvent) => void;
    onCompositionend?: (event: CompositionEvent) => void;
    onCompositionendCapture?: (event: CompositionEvent) => void;
    onCompositionstart?: (event: CompositionEvent) => void;
    onCompositionstartCapture?: (event: CompositionEvent) => void;
    onCompositionupdate?: (event: CompositionEvent) => void;
    onCompositionupdateCapture?: (event: CompositionEvent) => void;
    onBeforeToggle?: (event: ToggleEvent) => void;
    onBeforeToggleCapture?: (event: ToggleEvent) => void;
    onToggle?: (event: ToggleEvent) => void;
    onToggleCapture?: (event: ToggleEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onFocusCapture?: (event: FocusEvent) => void;
    onFocusin?: (event: FocusEvent) => void;
    onFocusinCapture?: (event: FocusEvent) => void;
    onFocusout?: (event: FocusEvent) => void;
    onFocusoutCapture?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onBlurCapture?: (event: FocusEvent) => void;
    onChange?: (event: Event) => void;
    onChangeCapture?: (event: Event) => void;
    onInput?: (event: InputEvent) => void;
    onInputCapture?: (event: InputEvent) => void;
    onReset?: (event: Event) => void;
    onResetCapture?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    onSubmitCapture?: (event: Event) => void;
    onInvalid?: (event: Event) => void;
    onInvalidCapture?: (event: Event) => void;
    onLoad?: (event: Event) => void;
    onLoadCapture?: (event: Event) => void;
    onError?: (event: Event) => void;
    onErrorCapture?: (event: Event) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyDownCapture?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
    onKeyPressCapture?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onKeyUpCapture?: (event: KeyboardEvent) => void;
    onAuxClick?: (event: MouseEvent) => void;
    onClick?: (event: PointerEvent) => void;
    onClickCapture?: (event: MouseEvent) => void;
    onContextMenu?: (event: MouseEvent) => void;
    onContextMenuCapture?: (event: MouseEvent) => void;
    onDblClick?: (event: MouseEvent) => void;
    onDblClickCapture?: (event: MouseEvent) => void;
    onDrag?: (event: DragEvent) => void;
    onDragCapture?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDragEndCapture?: (event: DragEvent) => void;
    onDragEnter?: (event: DragEvent) => void;
    onDragEnterCapture?: (event: DragEvent) => void;
    onDragExit?: (event: DragEvent) => void;
    onDragExitCapture?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDragLeaveCapture?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDragOverCapture?: (event: DragEvent) => void;
    onDragStart?: (event: DragEvent) => void;
    onDragStartCapture?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
    onDropCapture?: (event: DragEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseDownCapture?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onMouseMoveCapture?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    onMouseOutCapture?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseOverCapture?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseUpCapture?: (event: MouseEvent) => void;
    onTouchCancel?: (event: TouchEvent) => void;
    onTouchCancelCapture?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchEndCapture?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchMoveCapture?: (event: TouchEvent) => void;
    onTouchStart?: (event: TouchEvent) => void;
    onTouchStartCapture?: (event: TouchEvent) => void;
    onPointerDown?: (event: PointerEvent) => void;
    onPointerDownCapture?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerMoveCapture?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerUpCapture?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
    onPointerCancelCapture?: (event: PointerEvent) => void;
    onPointerEnter?: (event: PointerEvent) => void;
    onPointerEnterCapture?: (event: PointerEvent) => void;
    onPointerLeave?: (event: PointerEvent) => void;
    onPointerLeaveCapture?: (event: PointerEvent) => void;
    onPointerOver?: (event: PointerEvent) => void;
    onPointerOverCapture?: (event: PointerEvent) => void;
    onPointerOut?: (event: PointerEvent) => void;
    onPointerOutCapture?: (event: PointerEvent) => void;
    onGotPointerCapture?: (event: PointerEvent) => void;
    onGotPointerCaptureCapture?: (event: PointerEvent) => void;
    onLostPointerCapture?: (event: PointerEvent) => void;
    onLostPointerCaptureCapture?: (event: PointerEvent) => void;
    onScroll?: (event: UIEvent) => void;
    onScrollCapture?: (event: UIEvent) => void;
    onWheel?: (event: WheelEvent) => void;
    onWheelCapture?: (event: WheelEvent) => void;
    onAnimationStart?: (event: AnimationEvent) => void;
    onAnimationStartCapture?: (event: AnimationEvent) => void;
    onAnimationEnd?: (event: AnimationEvent) => void;
    onAnimationEndCapture?: (event: AnimationEvent) => void;
    onAnimationIteration?: (event: AnimationEvent) => void;
    onAnimationIterationCapture?: (event: AnimationEvent) => void;
    onTransitionCancel?: (event: TransitionEvent) => void;
    onTransitionCancelCapture?: (event: TransitionEvent) => void;
    onTransitionEnd?: (event: TransitionEvent) => void;
    onTransitionEndCapture?: (event: TransitionEvent) => void;
    onTransitionRun?: (event: TransitionEvent) => void;
    onTransitionRunCapture?: (event: TransitionEvent) => void;
    onTransitionStart?: (event: TransitionEvent) => void;
    onTransitionStartCapture?: (event: TransitionEvent) => void;
    [key: `aria-${string}`]: string | boolean | undefined;
    [key: `aria${string}`]: string | boolean | undefined;
  }
}
export interface JSXAttributes<T = Element> {
  key?: string | number;
  ref?: (elm?: T) => void;
}
