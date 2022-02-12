import React from "react"
import { Link } from "gatsby"
import { header, logo } from "./header.module.css"
import { HueSelect } from "./hueSelect"

export function Header() {
  return (
    <header className={header}>
      <Link className={logo} to="/">
        Matthew Tao
      </Link>
      <HueSelect />
    </header>
  )
}
