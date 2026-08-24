import React from "react";
declare global {
  interface Window {
    grecaptcha: any;
  }
}
type FormState = "normal" | "success" | "error";
declare const FormWrapper: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    children?: React.ReactNode | undefined;
  } & {
    state?: FormState;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  } & React.RefAttributes<HTMLElement>
>;
export default FormWrapper;
