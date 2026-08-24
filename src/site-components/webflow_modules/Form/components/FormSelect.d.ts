import React from "react";
declare const FormSelect: React.ForwardRefExoticComponent<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: Array<{
      v: string;
      t: string;
    }>;
  } & React.RefAttributes<HTMLSelectElement>
>;
export default FormSelect;
