import { Link, graphql } from "gatsby"
import React from "react"
import { BlogPostList } from "../../components/blogPostList"
import Seo from "../../components/layout/seo"
import { tags as tagsStyle } from "./blog.module.css"

export default function Blog({ data: { posts } }) {
  const { distinct: tags } = posts

  return (
    <>
      <Seo />
      <h1>
        Blog<em>.</em>
      </h1>
      <p>Sort by tag</p>
      <div className={tagsStyle}>
        {tags.map(tag => (
          <Link to={`/blog/tag/${tag}`}>#{tag}</Link>
        ))}
      </div>
      <BlogPostList posts={posts.edges.map(({ node }) => node)} />
    </>
  )
}

export const query = graphql`
  query {
    posts: allMarkdownRemark(
      sort: { order: DESC, fields: frontmatter___date }
    ) {
      distinct(field: frontmatter___tags)
      edges {
        node {
          ...BlogPostCard
        }
      }
    }
  }
`
