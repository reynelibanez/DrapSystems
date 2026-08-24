import * as React from "react";
import type { Props } from "../../types";
type NavbarButtonProps = Props<
  "div",
  {
    tag?: React.ElementType;
  }
>;
export type { NavbarButtonProps };
declare const NavbarButton: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: React.ElementType;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default NavbarButton;
