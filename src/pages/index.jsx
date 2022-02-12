import { graphql } from "gatsby"
import React from "react"
import { BlogPostList } from "../components/blogPostList"
import Seo from "../components/layout/seo"

export default function Home({ data: { posts } }) {
  return (
    <>
      <Seo />

      <h1>
        Blog<em>.</em>
      </h1>
      <BlogPostList posts={posts.edges.map(({ node }) => node)} />
    </>
  )
}

export const query = graphql`
  query {
    posts: allMarkdownRemark(
      limit: 5
      sort: { order: DESC, fields: frontmatter___date }
    ) {
      edges {
        node {
          frontmatter {
            title
            slug
            date
            description
          }
        }
      }
    }
  }
`
