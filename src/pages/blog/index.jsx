import { graphql, Link } from "gatsby";
import { kebabCase } from "lodash";
import React from "react";
import { BlogPostList } from "../../components/blogPostList";
import Seo from "../../components/layout/seo";
import { tags as tagsStyle } from "./blogIndex.module.css";

export default function Blog({ data: { posts } }) {
  const { group: tags } = posts;

  const sortedTags = tags.sort((a, b) => b.totalCount - a.totalCount);

  return (
    <>
      <Seo
        title="Blog"
        description="Matthew Tao's blog, some of my thoughts and tutorials on web development."
      />
      <h1 className="title">
        Blog<em>.</em>
      </h1>

      <div className={tagsStyle}>
        <span>Filter by tag:</span>
        {sortedTags.map(({ fieldValue: tag, totalCount }) => (
          <Link to={`/blog/tag/${kebabCase(tag)}`}>
            <small>
              #{tag} ({totalCount})
            </small>
          </Link>
        ))}
      </div>
      <BlogPostList posts={posts.edges.map(({ node }) => node)} />
    </>
  );
}

export const query = graphql`
  query {
    posts: allMarkdownRemark(
      sort: { order: DESC, fields: frontmatter___date }
      filter: {
        fileAbsolutePath: { regex: "/(posts)/" }
        frontmatter: { finished: { eq: true } }
      }
    ) {
      edges {
        node {
          ...BlogPostCard
        }
      }
      group(field: frontmatter___tags) {
        totalCount
        fieldValue
      }
    }
  }
`;
