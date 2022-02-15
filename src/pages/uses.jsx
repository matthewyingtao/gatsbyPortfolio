import React from "react"
import { graphql } from "gatsby"
import Seo from "../components/layout/seo"

export default function Home({ data }) {
  const {
    markdownRemark: { html },
  } = data

  return (
    <article>
      <Seo />
      <div className="blogContent">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  )
}

export const query = graphql`
  {
    markdownRemark(fileAbsolutePath: { regex: "/(uses)/" }) {
      html
    }
  }
`
