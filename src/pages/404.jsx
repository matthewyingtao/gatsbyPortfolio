import * as React from "react";
import { ArrowLink } from "../components/arrowLink";
import Seo from "../components/layout/seo";

export default function ErrorPage() {
  return (
    <article>
      <Seo />
      <h1>
        Error<em>.</em>
      </h1>
      <h2>That page doesn't exist 😅</h2>
      <p>Did you want to:</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <ArrowLink directionRight={false} to="/">
          Go home
        </ArrowLink>
        <ArrowLink directionRight={false} to="/blog">
          Read my blog posts
        </ArrowLink>
        <ArrowLink directionRight={false} to="/about">
          Find out more about me
        </ArrowLink>
      </div>
    </article>
  );
}
