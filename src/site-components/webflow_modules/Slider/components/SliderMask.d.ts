import * as React from "react";
import type { Props } from "../../types";
type SliderMaskProps = Props<"div">;
export type { SliderMaskProps };
declare const SliderMask: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default SliderMask;
