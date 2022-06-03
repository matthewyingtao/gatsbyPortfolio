import { graphql } from "gatsby";
import * as React from "react";
import Seo from "../components/layout/seo";

export default function Uses({ data }) {
  const {
    markdownRemark: { html },
  } = data;

  return (
    <article>
      <Seo
        title="About"
        description="Aspiring web developer. Find out a little more about me and what I do."
      />
      <h1 className="title">
        About Me<em>.</em>
      </h1>
      <div>
        <div
          className="blogContent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </article>
  );
}

export const query = graphql`
  {
    markdownRemark(fileAbsolutePath: { regex: "/(about)/" }) {
      html
    }
  }
`;
