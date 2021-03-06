import React from "react";
import { IoLogoGithub } from "react-icons/io";
import { Contact } from "./contact";
import { footer } from "./footer.module.css";

export function Footer() {
  return (
    <footer className={footer}>
      <Contact />
      <p>
        Made with 💖 by Matthew Tao using{" "}
        <a href="https://www.gatsbyjs.com/" target="_blank" rel="noreferrer">
          Gatsby JS
        </a>
        , hosted with{" "}
        <a href="https://www.netlify.com/" target="_blank" rel="noreferrer">
          Netlify
        </a>
      </p>
      <a
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
        href="https://github.com/matthewyingtao/gatsbyPortfolio"
        target="_blank"
        rel="noreferrer"
      >
        <IoLogoGithub size={24} /> Check out the source code on GitHub
      </a>
    </footer>
  );
}
