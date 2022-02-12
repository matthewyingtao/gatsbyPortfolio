import React from "react"
import { graphql } from "gatsby"
import Seo from "../../components/layout/seo"
import "./blogPage.css"

export default function Home({ data }) {
  const {
    markdownRemark: { frontmatter, html },
  } = data

  return (
    <>
      <Seo />
      <h1 className="blogTitle">{frontmatter.title}</h1>
      <article className="blogContent">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </>
  )
}

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        date
        description
        slug
        title
      }
    }
  }
`
