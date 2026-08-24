import * as React from "react";
import type { Props } from "../../types";
type SliderArrowProps = Props<
  "div",
  {
    dir: "left" | "right";
  }
>;
export type { SliderArrowProps };
declare const SliderArrow: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    dir: "left" | "right";
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default SliderArrow;
