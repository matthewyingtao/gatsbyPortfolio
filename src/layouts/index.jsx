import React from "react"
import { Header } from "../components/layout/header"
import { Footer } from "../components/layout/footer"
import { pageWrapper, contentGrid, main } from "./layout.module.css"
import "../styles/global.css"
import "../styles/reset.css"
import { SkipNavContent, SkipNavLink } from "../components/layout/skipNav"

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
  )
}
