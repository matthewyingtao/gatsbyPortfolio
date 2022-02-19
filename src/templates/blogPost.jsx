import React from "react";
import { Link, graphql } from "gatsby";
import Seo from "../components/layout/seo";
import "./blogPost.css";
import { kebabCase } from "lodash";

export default function Home({ data }) {
  const {
    markdownRemark: {
      frontmatter: { title, date, description, tags },
      html,
    },
  } = data;

  return (
    <article>
      <Seo title={title} description={description} />
      <h1 className="title">{title}</h1>
      <div className="blogContent">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p style={{ marginTop: "var(--space-xl)" }}>
          Written on{" "}
          <time dateTime={date}>
            <small>{date}</small>
          </time>{" "}
          in tags{" "}
          {tags.map(tag => (
            <>
              <Link to={`/blog/tag/${kebabCase(tag)}`}>
                <small>#{tag}</small>
              </Link>{" "}
            </>
          ))}
        </p>
      </div>
    </article>
  );
}

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        date
        description
        title
        tags
      }
    }
  }
`;
