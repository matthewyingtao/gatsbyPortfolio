import * as React from "react"
import { list } from "./blogPostList.module.css"
import { BlogPostCard } from "./blogPostCard"

export function BlogPostList({ posts }) {
  return (
    <ul className={list}>
      {posts.map(({ id, frontmatter: { title, date, description, slug } }) => (
        <BlogPostCard
          key={id}
          title={title}
          date={date}
          description={description}
          slug={slug}
        />
      ))}
    </ul>
  )
}
