export function getTagByExtendsString(
  extendsClassText: string | undefined,
): string | undefined {
  switch (extendsClassText) {
    case "HTMLAnchorElement":
      return "a";
    case "HTMLAreaElement":
      return "area";
    case "HTMLAudioElement":
      return "audio";
    case "HTMLBRElement":
      return "br";
    case "HTMLBaseElement":
      return "base";
    case "HTMLBodyElement":
      return "body";
    case "HTMLButtonElement":
      return "button";
    case "HTMLCanvasElement":
      return "canvas";
    case "HTMLDataElement":
      return "data";
    case "HTMLDataListElement":
      return "datalist";
    case "HTMLDetailsElement":
      return "details";
    case "HTMLDialogElement":
      return "dialog";
    case "HTMLDivElement":
      return "div";
    case "HTMLDListElement":
      return "dl";
    case "HTMLEmbedElement":
      return "embed";
    case "HTMLFieldSetElement":
      return "fieldset";
    case "HTMLFormElement":
      return "form";
    case "HTMLHRElement":
      return "hr";
    case "HTMLHeadElement":
      return "head";
    case "HTMLHeadingElement":
      return "h1"; // Note: HTMLHeadingElement is for h1-h6, but we return h1 as default
    case "HTMLHtmlElement":
      return "html";
    case "HTMLIFrameElement":
      return "iframe";
    case "HTMLImageElement":
      return "img";
    case "HTMLInputElement":
      return "input";
    case "HTMLLIElement":
      return "li";
    case "HTMLLabelElement":
      return "label";
    case "HTMLLegendElement":
      return "legend";
    case "HTMLLinkElement":
      return "link";
    case "HTMLMapElement":
      return "map";
    case "HTMLMetaElement":
      return "meta";
    case "HTMLMeterElement":
      return "meter";
    case "HTMLModElement":
      return "ins"; // Note: HTMLModElement is for ins/del, but we return ins as default
    case "HTMLOListElement":
      return "ol";
    case "HTMLOptGroupElement":
      return "optgroup";
    case "HTMLOptionElement":
      return "option";
    case "HTMLOutputElement":
      return "output";
    case "HTMLParagraphElement":
      return "p";
    case "HTMLParamElement":
      return "param";
    case "HTMLPictureElement":
      return "picture";
    case "HTMLPreElement":
      return "pre";
    case "HTMLProgressElement":
      return "progress";
    case "HTMLQuoteElement":
      return "blockquote"; // HTMLQuoteElement is for blockquote/q, but we return blockquote as default
    case "HTMLScriptElement":
      return "script";
    case "HTMLSelectElement":
      return "select";
    case "HTMLSlotElement":
      return "slot";
    case "HTMLSourceElement":
      return "source";
    case "HTMLSpanElement":
      return "span";
    case "HTMLStyleElement":
      return "style";
    case "HTMLTableElement":
      return "table";
    case "HTMLTableCaptionElement":
      return "caption";
    case "HTMLTableCellElement":
      return "td"; // TODO: HTMLTableCellElement is for td/th, but we return td as default
    case "HTMLTableColElement":
      return "col";
    case "HTMLTableRowElement":
      return "tr";
    case "HTMLTableSectionElement":
      return "tbody"; // TODO: HTMLTableSectionElement is for tbody/thead/tfoot, but we return tbody as default
    case "HTMLTemplateElement":
      return "template";
    case "HTMLTextAreaElement":
      return "textarea";
    case "HTMLTimeElement":
      return "time";
    case "HTMLTitleElement":
      return "title";
    case "HTMLTrackElement":
      return "track";
    case "HTMLUListElement":
      return "ul";
    case "HTMLVideoElement":
      return "video";
    default:
      break;
  }

  return;
}
