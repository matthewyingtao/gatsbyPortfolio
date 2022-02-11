import React from "react"
import { Header } from "../components/layout/header"
import { Footer } from "../components/layout/footer"
import { pageWrapper, contentGrid, main } from "./layout.module.css"
import "../styles/global.css"
import "../styles/reset.css"

export default function Layout({ children }) {
  return (
    <div className={pageWrapper}>
      <div className={contentGrid}>
        <Header />
        <main className={main}>{children}</main>
        <Footer />
      </div>
    </div>
  )
}
