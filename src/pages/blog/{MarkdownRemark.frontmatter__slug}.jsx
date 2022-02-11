import React from "react"
import { graphql } from "gatsby"
import Seo from "../../components/layout/seo"
import "./blogPage.css"

export default function Home({ data }) {
  const { markdownRemark } = data
  const { frontmatter, html } = markdownRemark

  return (
    <>
      <Seo />
      <h1>{frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
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
