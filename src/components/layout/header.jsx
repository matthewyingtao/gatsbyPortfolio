import React from "react"
import { Link } from "gatsby"
import { header, topRow, links, logo } from "./header.module.css"
import { HueSelect } from "./hueSelect"

export function Header() {
  const routes = [
    {
      name: "Home",
      to: "/",
    },
    {
      name: "Blog",
      to: "/blog",
    },
    {
      name: "Projects",
      to: "/projects",
    },
    {
      name: "About",
      to: "/about",
    },
  ]

  return (
    <header className={header}>
      <div className={topRow}>
        <Link className={logo} to="/">
          Matthew Tao
        </Link>
        <HueSelect />
      </div>
      <nav className={links}>
        {routes.map(({ name, to }, i) => (
          <>
            <Link to={to}>{name}</Link>
            <em>|</em>
          </>
        ))}
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}
