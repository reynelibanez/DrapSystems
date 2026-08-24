import React from "react";
declare const FormReCaptcha: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    siteKey?: string;
    theme?: "light" | "dark";
    size?: "compact" | "normal" | "invisible";
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default FormReCaptcha;
