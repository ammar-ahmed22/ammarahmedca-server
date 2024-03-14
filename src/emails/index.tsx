import * as React from "react";
import ConfirmationCode from "./ConfirmationCode";
import { render } from "@react-email/components";

export function toHTML<T extends React.JSX.IntrinsicAttributes>(
  component: React.FC<T>,
  props: T
): string {
  const Component = component;
  return render(<Component {...props} />, { pretty: true });
}

export function toPlainText<T extends React.JSX.IntrinsicAttributes>(
  component: React.FC<T>,
  props: T
) {
  const Component = component;
  return render(<Component {...props} />, { plainText: true });
}
