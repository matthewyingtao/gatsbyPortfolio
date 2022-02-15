import React from "react"
import { graphql } from "gatsby"
import Seo from "../components/layout/seo"

export default function Uses({ data }) {
  const {
    markdownRemark: { html },
  } = data

  return (
    <article>
      <Seo
        title="/Uses"
        description="Inspired by Wes Bos' uses page."
      />
      <h1 className="title"><em>/</em>Uses</h1>
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
