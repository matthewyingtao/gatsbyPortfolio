import React from "react";
import { Link } from "gatsby";
import {
  linkWrapper,
  canScrollRight,
  canScrollLeft,
  links,
  active,
} from "./nav.module.css";

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
  {
    name: "Uses",
    to: "/uses",
  },
];

export const Nav = () => {
  const wrapperEl = React.useRef(null);

  React.useEffect(() => {
    const navLinks = wrapperEl.current.querySelectorAll(`a`);

    const firstLink = navLinks[0];
    const lastLink = navLinks[navLinks.length - 1];

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const scrollClass =
            entry.target === firstLink ? canScrollLeft : canScrollRight;

          console.log(scrollClass);

          if (entry.intersectionRatio != 1) {
            if (!wrapperEl.current.classList.contains(scrollClass)) {
              wrapperEl.current.classList.add(scrollClass);
            }
          } else {
            wrapperEl.current.classList.remove(scrollClass);
          }
        });
      },
      { threshold: 1 }
    );

    observer.observe(firstLink);
    observer.observe(lastLink);
  });

  return (
    <div className={linkWrapper} ref={wrapperEl}>
      <nav className={links}>
        {routes.map(({ name, to }) => (
          <>
            <Link activeClassName={active} to={to}>
              {name}
            </Link>
            <em>|</em>
          </>
        ))}
        <a href="#contact">Contact</a>
      </nav>
    </div>
  );
};
