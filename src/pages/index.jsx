import { graphql, Link } from "gatsby"
import React from "react"
import Seo from "../components/layout/seo"

export default function Home({ data: { posts } }) {
  return (
    <>
      <Seo />
      {posts.edges.map(({ node: { id, frontmatter } }) => {
        return (
          <div key={id}>
            <Link to={`/blog/${frontmatter.slug}`}>
              <h2>{frontmatter.title}</h2>
            </Link>
            <p>{frontmatter.date}</p>
            <p>{frontmatter.description}</p>
          </div>
        )
      })}
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
