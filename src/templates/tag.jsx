import React from "react";
import { graphql } from "gatsby";
import { BlogPostList } from "../components/blogPostList";

export default function Tags({ pageContext, data: { posts } }) {
  const { tag } = pageContext;
  const { totalCount } = posts;
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? "" : "s"
  } tagged with "${tag}"`;

  return (
    <>
      <h2 style={{ marginBottom: "var(--space-xl)" }}>{tagHeader}</h2>
      <BlogPostList posts={posts.edges.map(({ node }) => node)} />
    </>
  );
}

export const pageQuery = graphql`
  query ($tag: String) {
    posts: allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          ...BlogPostCard
        }
      }
    }
  }
`;
