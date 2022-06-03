import { Link } from "gatsby";
import React from "react";
import { header, logo, topRow } from "./header.module.css";
import { HueSelect } from "./hueSelect";
import { Nav } from "./nav";

export function Header() {
  return (
    <header className={header}>
      <div className={topRow}>
        <Link className={logo} to="/">
          Matthew Tao
        </Link>
        <HueSelect />
      </div>
      <Nav />
    </header>
  );
}
