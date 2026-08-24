import * as React from "react";
import type { Props } from "../../types";
type DropdownToggleProps = Props<
  "div",
  {
    tag?: keyof HTMLElementTagNameMap;
  }
>;
export type { DropdownToggleProps };
declare const DropdownToggle: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: keyof HTMLElementTagNameMap;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default DropdownToggle;
