// Components interfaces
import type { Components as IoniconsComponents, JSX as IoniconsJSX } from 'ionicons';

export * from "./components.ts";
export * from "./index.ts";
export { AccordionGroupCustomEvent } from "./components/accordion-group/accordion-group-interface.ts";
export { AlertOptions } from "./components/alert/alert-interface.ts";
export { ActionSheetOptions } from "./components/action-sheet/action-sheet-interface.ts";
export { BreadcrumbCustomEvent } from "./components/breadcrumb/breadcrumb-interface.ts";
export { ScrollBaseCustomEvent, ScrollCallback, ScrollCustomEvent } from "./components/content/content-interface.ts";
export { CheckboxCustomEvent } from "./components/checkbox/checkbox-interface.ts";
export { DatetimeCustomEvent, DatetimeHighlightStyle } from "./components/datetime/datetime-interface.ts";
export { InfiniteScrollCustomEvent } from "./components/infinite-scroll/infinite-scroll-interface.ts";
export { InputCustomEvent } from "./components/input/input-interface.ts";
export { InputOtpCustomEvent } from "./components/input-otp/input-otp-interface.ts";
export { CounterFormatter } from "./components/item/item-interface.ts";
export { ItemSlidingCustomEvent } from "./components/item-sliding/item-sliding-interface.ts";
export { LoadingOptions } from "./components/loading/loading-interface.ts";
export { MenuCustomEvent, MenuI, MenuControllerI } from "./components/menu/menu-interface.ts";
export { ModalOptions, ModalCustomEvent } from "./components/modal/modal-interface.ts";
export { NavDirection, NavCustomEvent } from "./components/nav/nav-interface.ts";
export { PickerOptions, PickerColumnOption } from "./components/picker-legacy/picker-interface.ts";
export { PopoverOptions } from "./components/popover/popover-interface.ts";
export { RadioGroupCustomEvent } from "./components/radio-group/radio-group-interface.ts";
export { RangeCustomEvent, PinFormatter } from "./components/range/range-interface.ts";
export { RouterCustomEvent } from "./components/router/utils/interface.ts";
export { RefresherCustomEvent } from "./components/refresher/refresher-interface.ts";
export {
  ItemReorderCustomEvent,
  ReorderEndCustomEvent,
  ReorderMoveCustomEvent,
} from "./components/reorder-group/reorder-group-interface.ts";
export { SearchbarCustomEvent } from "./components/searchbar/searchbar-interface.ts";
export { SegmentCustomEvent } from "./components/segment/segment-interface.ts";
export { SelectCustomEvent, SelectCompareFn } from "./components/select/select-interface.ts";
export { TabsCustomEvent } from "./components/tabs/tabs-interface.ts";
export { TextareaCustomEvent } from "./components/textarea/textarea-interface.ts";
export { ToastOptions } from "./components/toast/toast-interface.ts";
export { ToggleCustomEvent } from "./components/toggle/toggle-interface.ts";
export { BackButtonEvent, BackButtonEventDetail } from "./utils/hardware-back-button.ts";

// Types from utils
export {
  Animation,
  AnimationBuilder,
  AnimationCallbackOptions,
  AnimationDirection,
  AnimationFill,
  AnimationKeyFrames,
  AnimationLifecycle,
} from "./utils/animation/animation-interface.ts";
export { HTMLStencilElement } from "./utils/element-interface.ts";
export { TransitionOptions } from "./utils/transition/index.ts";
export { HTMLIonOverlayElement, OverlayController, OverlayInterface } from "./utils/overlays-interface.ts";
export { Config, config } from "./global/config.ts";
export { Gesture, GestureConfig, GestureDetail } from "./utils/gesture/index.ts";

// From: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
export type AutocompleteTypes =
  | 'on'
  | 'off'
  | 'name'
  | 'honorific-prefix'
  | 'given-name'
  | 'additional-name'
  | 'family-name'
  | 'honorific-suffix'
  | 'nickname'
  | 'email'
  | 'username'
  | 'new-password'
  | 'current-password'
  | 'one-time-code'
  | 'organization-title'
  | 'organization'
  | 'street-address'
  | 'address-line1'
  | 'address-line2'
  | 'address-line3'
  | 'address-level4'
  | 'address-level3'
  | 'address-level2'
  | 'address-level1'
  | 'country'
  | 'country-name'
  | 'postal-code'
  | 'cc-name'
  | 'cc-given-name'
  | 'cc-additional-name'
  | 'cc-family-name'
  | 'cc-family-name'
  | 'cc-number'
  | 'cc-exp'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-csc'
  | 'cc-type'
  | 'transaction-currency'
  | 'transaction-amount'
  | 'language'
  | 'bday'
  | 'bday-day'
  | 'bday-month'
  | 'bday-year'
  | 'sex'
  | 'tel'
  | 'tel-country-code'
  | 'tel-national'
  | 'tel-area-code'
  | 'tel-local'
  | 'tel-extension'
  | 'impp'
  | 'url'
  | 'photo';

export type TextFieldTypes =
  | 'date'
  | 'email'
  | 'number'
  | 'password'
  | 'search'
  | 'tel'
  | 'text'
  | 'url'
  | 'time'
  | 'week'
  | 'month'
  | 'datetime-local';
export type PredefinedColors =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'
  | 'medium'
  | 'dark';

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

export type Color = LiteralUnion<PredefinedColors, string>;
export type Mode = 'ios' | 'md';
export type ComponentTags = string;
// eslint-disable-next-line
export type ComponentRef = Function | HTMLElement | string | null;
// eslint-disable-next-line
export type ComponentProps<T = null> = { [key: string]: any };
export type CssClassMap = { [className: string]: boolean };

export interface FrameworkDelegate {
  attachViewToDom(container: any, component: any, propsOrDataObj?: any, cssClasses?: string[]): Promise<HTMLElement>;
  removeViewFromDom(container: any, component: any): Promise<void>;
}

export interface KeyboardEventDetail {
  keyboardHeight: number;
}

export interface StyleEventDetail {
  [styleName: string]: boolean;
}

export { NavComponentWithProps } from "./components/nav/nav-interface.ts";

declare module "./components.ts" {
  export namespace Components {
    export type IonIcon = IoniconsComponents.IonIcon;
  }
}

declare module "./components.ts" {
  export namespace JSX {
    export type IonIcon = IoniconsJSX.IonIcon;
  }
}
