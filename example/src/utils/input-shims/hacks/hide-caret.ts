import { addEventListener, removeEventListener } from "../../helpers.ts";

import { isFocused, relocateInput } from "./common.ts";

export const enableHideCaretOnScroll = (
  componentEl: HTMLElement,
  inputEl: HTMLInputElement | HTMLTextAreaElement | undefined,
  scrollEl: HTMLElement | undefined
) => {
  if (!(scrollEl && inputEl)) {
    return () => {
      return;
    };
  }

  const scrollHideCaret = (shouldHideCaret: boolean) => {
    if (isFocused(inputEl)) {
      relocateInput(componentEl, inputEl, shouldHideCaret);
    }
  };

  const onBlur = () => relocateInput(componentEl, inputEl, false);
  const hideCaret = () => scrollHideCaret(true);
  const showCaret = () => scrollHideCaret(false);

  addEventListener(scrollEl, 'ionScrollStart', hideCaret);
  addEventListener(scrollEl, 'ionScrollEnd', showCaret);
  inputEl.addEventListener('blur', onBlur);

  return () => {
    removeEventListener(scrollEl, 'ionScrollStart', hideCaret);
    removeEventListener(scrollEl, 'ionScrollEnd', showCaret);
    inputEl.removeEventListener('blur', onBlur);
  };
};
