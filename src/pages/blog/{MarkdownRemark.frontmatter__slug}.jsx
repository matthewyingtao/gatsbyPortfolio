import React from "react"
import { Link, graphql } from "gatsby"
import Seo from "../../components/layout/seo"
import "./blogPage.css"

export default function Home({ data }) {
  const {
    markdownRemark: {
      frontmatter: { title, date, description, tags, finished },
      html,
      tableOfContents,
    },
  } = data

  return (
    <article>
      <Seo title={title} description={description} />
      <h1 className="blogTitle">{title}</h1>
      <div className="blogContent">
        {!finished && (
          <p className="blogStatus">⚠️This post is a work in progress!⚠️</p>
        )}
        <div className="tableOfContents">
          <h2>Table of Contents</h2>
          <div dangerouslySetInnerHTML={{ __html: tableOfContents }} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p style={{ marginTop: "var(--space-xl)" }}>
          <time dateTime={date}>
            <small>Written on {date}</small>
          </time>{" "}
          in tags{" "}
          {tags.map(tag => (
            <Link to={`/blog/tag/${tag}`}>
              <small>#{tag}</small>
            </Link>
          ))}
        </p>
      </div>
    </article>
  )
}

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      tableOfContents
      html
      frontmatter {
        date
        description
        title
        tags
        finished
      }
    }
  }
`
