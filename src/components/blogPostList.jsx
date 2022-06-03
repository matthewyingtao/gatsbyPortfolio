import * as React from "react";
import { BlogPostCard } from "./blogPostCard";
import { list } from "./blogPostList.module.css";

export function BlogPostList({ posts }) {
  return (
    <div className={list}>
      {posts.map(
        ({ id, frontmatter: { title, date, description, slug, tags } }) => (
          <BlogPostCard
            key={id}
            title={title}
            date={date}
            description={description}
            slug={slug}
            tags={tags}
          />
        )
      )}
    </div>
  );
}
