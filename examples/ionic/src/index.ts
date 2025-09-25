import 'ionicons';

export { createAnimation } from "./utils/animation/animation.ts";
export { getIonPageElement } from "./utils/transition/index.ts";
export { iosTransitionAnimation } from "./utils/transition/ios.transition.ts";
export { mdTransitionAnimation } from "./utils/transition/md.transition.ts";
export { getTimeGivenProgression } from "./utils/animation/cubic-bezier.ts";
export { createGesture } from "./utils/gesture/index.ts";
export { initialize } from "./global/ionic-global.ts";
export { componentOnReady } from "./utils/helpers.ts";
export { LogLevel } from "./utils/logging/index.ts";
export { isPlatform, Platforms, PlatformConfig, getPlatforms } from "./utils/platform.ts";
export { IonicSafeString } from "./utils/sanitization/index.ts";
export { IonicConfig, getMode, setupConfig } from "./utils/config.ts";
export { openURL } from "./utils/theme.ts";
export {
  LIFECYCLE_WILL_ENTER,
  LIFECYCLE_DID_ENTER,
  LIFECYCLE_WILL_LEAVE,
  LIFECYCLE_DID_LEAVE,
  LIFECYCLE_WILL_UNLOAD,
} from "./components/nav/constants.ts";
export { menuController } from "./utils/menu-controller/index.ts";
export {
  alertController,
  actionSheetController,
  modalController,
  loadingController,
  pickerController,
  popoverController,
  toastController,
} from "./utils/overlays.ts";
export { IonicSlides } from "./components/slides/IonicSlides.ts";
