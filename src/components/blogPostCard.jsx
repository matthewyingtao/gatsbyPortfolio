import * as React from "react";
import { Link, graphql } from "gatsby";
import {
  card,
  postData,
  date as dateStyle,
  tagsWrapper,
} from "./blogPostCard.module.css";
import { kebabCase } from "lodash";

export function BlogPostCard({ title, date, description, slug, tags }) {
  return (
    <Link
      className={card}
      style={{ textDecoration: "none" }}
      to={`/blog/post/${slug}`}
    >
      <div className={postData}>
        <time className={dateStyle} dateTime={date}>
          {date}
        </time>{" "}
        <div className={tagsWrapper}>
          {tags.map(tag => (
            <>
              <Link to={`/blog/tag/${kebabCase(tag)}`}>#{tag}</Link>{" "}
            </>
          ))}
        </div>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </Link>
  );
}

export const query = graphql`
  fragment BlogPostCard on MarkdownRemark {
    frontmatter {
      date
      slug
      title
      description
      tags
    }
  }
`;
