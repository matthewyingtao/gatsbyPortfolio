import { graphql } from "gatsby";
import React from "react";
import Seo from "../components/layout/seo";

export default function Uses({ data }) {
  const {
    markdownRemark: { html },
  } = data;

  return (
    <article>
      <Seo
        title="/Uses"
        description="Inspired by Wes Bos' uses page, the tech I use on a daily basis."
      />
      <h1 className="title">
        <em>/</em>Uses
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
    markdownRemark(fileAbsolutePath: { regex: "/(uses)/" }) {
      html
    }
  }
`;
