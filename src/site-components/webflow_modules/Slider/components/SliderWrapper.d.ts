import * as React from "react";
import { SliderConfig } from "../helpers/sliderContext";
type SliderWrapperProps = SliderConfig &
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
  };
export type { SliderWrapperProps };
declare const SliderWrapper: React.ForwardRefExoticComponent<
  SliderConfig &
    React.HTMLAttributes<HTMLDivElement> & {
      className?: string;
    } & React.RefAttributes<HTMLDivElement>
>;
export default SliderWrapper;
