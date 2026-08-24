import * as React from "react";
import type { Props } from "../../types";
type DropdownProps = Props<
  "div",
  {
    tag?: keyof HTMLElementTagNameMap;
  }
>;
type DropdownWrapperProps = DropdownProps & {
  delay: number;
  hover: boolean;
};
export type { DropdownWrapperProps };
declare const DropdownWrapper: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: keyof HTMLElementTagNameMap;
  } & {
    children?: React.ReactNode | undefined;
  } & {
    delay: number;
    hover: boolean;
  } & React.RefAttributes<HTMLElement>
>;
export default DropdownWrapper;
