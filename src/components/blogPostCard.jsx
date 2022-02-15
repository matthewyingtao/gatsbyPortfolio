import * as React from "react"
import { Link, graphql } from "gatsby"
import {
  card,
  postData,
  date as dateStyle,
  tagsWrapper,
} from "./blogPostCard.module.css"

export function BlogPostCard({ title, date, description, slug, tags }) {
  return (
    <Link style={{ textDecoration: "none" }} to={`/blog/post/${slug}`}>
      <div className={card}>
        <div className={postData}>
          <time className={dateStyle} dateTime={date}>
            {date}
          </time>{" "}
          <div className={tagsWrapper}>
            {tags.map(tag => (
              <>
                <Link to={`/blog/tag/${tag}`}>#{tag}</Link>{" "}
              </>
            ))}
          </div>
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </Link>
  )
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
`
