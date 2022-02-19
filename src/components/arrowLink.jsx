import * as React from "react";
import { Link } from "gatsby";
import { IoIosArrowRoundForward, IoIosArrowRoundBack } from "react-icons/io";
import { arrowLink as arrowLinkStyle, left } from "./arrowLink.module.css";

export function ArrowLink({ to, children, directionRight = true, ...props }) {
  return directionRight ? (
    <Link to={to} className={arrowLinkStyle} {...props}>
      {children} <IoIosArrowRoundForward size={32} />
    </Link>
  ) : (
    <Link to={to} className={[arrowLinkStyle, left].join(" ")} {...props}>
      <IoIosArrowRoundBack size={32} /> {children}
    </Link>
  );
}
