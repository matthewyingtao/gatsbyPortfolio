import * as React from "react";
import { graphql } from "gatsby";
import Seo from "../components/layout/seo";

export default function Uses({ data }) {
  const {
    markdownRemark: { html },
  } = data;

  return (
    <article>
      <Seo />
      <h1 className="title">
        About Me<em>.</em>
      </h1>
      <div className="blogContent">
        <div dangerouslySetInnerHTML={{ __html: html }} />
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
