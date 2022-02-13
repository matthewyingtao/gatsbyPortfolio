import * as React from "react"
import { Link } from "gatsby"
import { IoIosArrowRoundForward } from "react-icons/io"
import { arrowLink as arrowLinkStyle } from "./arrowLink.module.css"

export function ArrowLink({ to, text, ...props }) {
  return (
    <Link to={to} className={arrowLinkStyle} {...props}>
      {text} <IoIosArrowRoundForward size={32} />
    </Link>
  )
}