import type { ComponentInterface } from '@stencil/core';
import { Component, Host, Prop, h } from '@stencil/core';
import { createColorClasses } from '@utils/theme';

import { config } from "../../global/config.ts";
import { getIonMode } from "../../global/ionic-global.ts";
import type { Color } from "../../interface.ts";

import type { SpinnerTypes } from "./spinner-configs.ts";
import { SPINNERS } from "./spinner-configs.ts";
import type { SpinnerConfig } from "./spinner-interface.ts";

@Component({
  tag: 'ion-spinner',
  styleUrl: 'spinner.scss',
  shadow: true,
})
export class Spinner implements ComponentInterface {
  /**
   * The color to use from your application's color palette.
   * Default options are: `"primary"`, `"secondary"`, `"tertiary"`, `"success"`, `"warning"`, `"danger"`, `"light"`, `"medium"`, and `"dark"`.
   * For more information on colors, see [theming](/docs/theming/basics).
   */
  @Prop({ reflect: true }) color?: Color;

  /**
   * Duration of the spinner animation in milliseconds. The default varies based on the spinner.
   */
  @Prop() duration?: number;

  /**
   * The name of the SVG spinner to use. If a name is not provided, the platform's default
   * spinner will be used.
   */
  @Prop() name?: SpinnerTypes;

  /**
   * If `true`, the spinner's animation will be paused.
   */
  @Prop() paused = false;

  private getName(): SpinnerTypes {
    const spinnerName = this.name || config.get('spinner');
    const mode = getIonMode(this);
    if (spinnerName) {
      return spinnerName;
    }
    return mode === 'ios' ? 'lines' : 'circular';
  }

  render() {
    const mode = getIonMode(this);
    const spinnerName = this.getName();
    const spinner = SPINNERS[spinnerName] ?? SPINNERS['lines'];
    const duration = typeof this.duration === 'number' && this.duration > 10 ? this.duration : spinner.dur;
    const svgs: SVGElement[] = [];

    if (spinner.circles !== undefined) {
      for (let i = 0; i < spinner.circles; i++) {
        svgs.push(buildCircle(spinner, duration, i, spinner.circles));
      }
    } else if (spinner.lines !== undefined) {
      for (let i = 0; i < spinner.lines; i++) {
        svgs.push(buildLine(spinner, duration, i, spinner.lines));
      }
    }

    return (
      <Host
        class={createColorClasses(this.color, {
          [mode]: true,
          [`spinner-${spinnerName}`]: true,
          'spinner-paused': this.paused || config.getBoolean('_testing'),
        })}
        role="progressbar"
        style={spinner.elmDuration ? { animationDuration: duration + 'ms' } : {}}
      >
        {svgs}
      </Host>
    );
  }
}

const buildCircle = (spinner: SpinnerConfig, duration: number, index: number, total: number) => {
  const data = spinner.fn(duration, index, total);
  data.style['animation-duration'] = duration + 'ms';

  return (
    <svg viewBox={data.viewBox || '0 0 64 64'} style={data.style}>
      <circle
        transform={data.transform || 'translate(32,32)'}
        cx={data.cx}
        cy={data.cy}
        r={data.r}
        style={spinner.elmDuration ? { animationDuration: duration + 'ms' } : {}}
      />
    </svg>
  );
};

const buildLine = (spinner: SpinnerConfig, duration: number, index: number, total: number) => {
  const data = spinner.fn(duration, index, total);
  data.style['animation-duration'] = duration + 'ms';

  return (
    <svg viewBox={data.viewBox || '0 0 64 64'} style={data.style}>
      <line transform="translate(32,32)" y1={data.y1} y2={data.y2} />
    </svg>
  );
};
