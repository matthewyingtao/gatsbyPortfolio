import React from "react"
import { graphql } from "gatsby"
import Seo from "../../components/layout/seo"
import "./blogPage.css"

export default function Home({ data }) {
  const {
    markdownRemark: {
      frontmatter: { title, date, description },
      html,
      tableOfContents,
    },
  } = data

  return (
    <>
      <Seo title={title} description={description} />
      <h1 className="blogTitle">{title}</h1>
      <article className="blogContent">
        <div className="tableOfContents">
          <h2>Table of Contents</h2>
          <div dangerouslySetInnerHTML={{ __html: tableOfContents }} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </>
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
      }
    }
  }
`
