const path = require("path")
const _ = require("lodash")

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions

  const tagTemplate = path.resolve("src/templates/tag.jsx")

  const result = await graphql(`
    {
      tagsGroup: allMarkdownRemark(
        filter: {
          fileAbsolutePath: { regex: "/(posts)/" }
          frontmatter: { finished: { eq: true } }
        }
      ) {
        group(field: frontmatter___tags) {
          fieldValue
        }
        edges {
          node {
            id
            frontmatter {
              slug
            }
          }
        }
      }
    }
  `)

  // handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }

  // Extract tag data from query
  const tags = result.data.tagsGroup.group

  // Make tag pages
  tags.forEach(tag => {
    createPage({
      path: `blog/tag/${_.kebabCase(tag.fieldValue)}`,
      component: tagTemplate,
      context: {
        tag: tag.fieldValue,
      },
    })
  })

  // Make post pages
  const posts = result.data.tagsGroup.edges

  posts.forEach(({ node }) => {
    createPage({
      path: `/blog/post/${node.frontmatter.slug}`,
      component: path.resolve(`./src/templates/blogPost.jsx`),
      context: {
        id: node.id,
      },
    })
  })
}
