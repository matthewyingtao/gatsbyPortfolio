import * as React from "react";
import { skip } from "./skipNav.module.css";

export function SkipNavLink() {
  return (
    <a className={skip} href="#skip-to-content">
      Skip to content
    </a>
  );
}

export function SkipNavContent({ children, ...props }) {
  return (
    <main id="skip-to-content" {...props}>
      {children}
    </main>
  );
}
