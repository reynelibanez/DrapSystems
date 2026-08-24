import * as React from "react";
import type { Props } from "../../types";
type SliderSlideProps = Props<
  "div",
  {
    tag?: string;
    index?: number;
  }
>;
export type { SliderSlideProps };
declare const SliderSlide: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: string;
    index?: number;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default SliderSlide;
