import type { AnimationBuilder, Mode } from "../../interface.ts";
import type { IonicSafeString } from "../../utils/sanitization/index.ts";
import type { SpinnerTypes } from "../spinner/spinner-configs.ts";

export interface LoadingOptions {
  spinner?: SpinnerTypes | null;
  message?: string | IonicSafeString;
  cssClass?: string | string[];
  showBackdrop?: boolean;
  duration?: number;
  translucent?: boolean;
  animated?: boolean;
  backdropDismiss?: boolean;
  mode?: Mode;
  keyboardClose?: boolean;
  id?: string;
  htmlAttributes?: { [key: string]: any };

  enterAnimation?: AnimationBuilder;
  leaveAnimation?: AnimationBuilder;
}
