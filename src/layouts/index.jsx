import React from "react";
import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import { SkipNavContent, SkipNavLink } from "../components/layout/skipNav";
import "../styles/global.css";
import "../styles/reset.css";
import { contentGrid, main, pageWrapper } from "./layout.module.css";

export default function Layout({ children }) {
  return (
    <div className={pageWrapper}>
      <div className={contentGrid}>
        <SkipNavLink />
        <Header />
        <SkipNavContent className={main}>{children}</SkipNavContent>
        <Footer />
      </div>
    </div>
  );
}
