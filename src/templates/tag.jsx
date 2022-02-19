import React from "react";
import { graphql } from "gatsby";
import { BlogPostList } from "../components/blogPostList";
import { ArrowLink } from "../components/arrowLink";

export default function Tags({ pageContext, data: { posts } }) {
  const { tag } = pageContext;
  const { totalCount } = posts;
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? "" : "s"
  } tagged with`;

  return (
    <>
      <ArrowLink
        to="/blog"
        directionRight={false}
        style={{ marginBottom: "var(--space-lg)" }}
      >
        Back to all posts
      </ArrowLink>
      <h3 style={{ marginBottom: "var(--space-xl)" }}>
        {tagHeader} "{tag}"
      </h3>
      <BlogPostList posts={posts.edges.map(({ node }) => node)} />
    </>
  );
}

export const pageQuery = graphql`
  query ($tag: String) {
    posts: allMarkdownRemark(
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
