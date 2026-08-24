import * as React from "react";
import type { Props } from "../../types";
type DropdownListProps = Props<
  "nav",
  {
    tag?: keyof HTMLElementTagNameMap;
  }
>;
export type { DropdownListProps };
declare const DropdownList: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"nav"> & {
    tag?: keyof HTMLElementTagNameMap;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default DropdownList;
