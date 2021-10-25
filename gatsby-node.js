const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

exports.createPages = async ({ graphql, actions, reporter }) => {
    const { createPage } = actions;

    /** The template to use for all blog posts. */
    const blogPostTemplate = path.resolve("./src/templates/BlogPost.tsx");

    /** The template to use for tags. */
    const tagTemplate = path.resolve("./src/templates/Tags.tsx");

    /** Get all markdown blog posts sorted by date. */
    const result = await graphql(`
    {
      postsRemark: allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 2000
      ) {
        edges {
          node {
            id
            fields {
              slug
            }
            frontmatter {
              tags
            }
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 2000) {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `);

    /** Handle errors building. */
    if (result.errors) {
        reporter.panicOnBuild(
            `There was an error loading your blog posts`,
            result.errors
        );
        return;
    }

    /** The posts from the graphql query. */
    const posts = result.data.postsRemark.edges;

    /**
     * Create the blog post pages using the blog post template if there's at
     * least one markdown file in "content/blog".
     * 
     * `context` is available in the template as a prop and as a variable in
     * GraphQL.
     */
    if (posts.length > 0) {
        posts.forEach((post, index) => {
            const previousPostId = index === 0 ? null : posts[index - 1].node.id;
            const nextPostId =
                index === posts.length - 1 ? null : posts[index + 1].node.id;

            createPage({
                path: post.node.fields.slug,
                component: blogPostTemplate,
                context: {
                    id: post.node.id,
                    previousPostId,
                    nextPostId,
                },
            });
        });
    }

    /** Extract tag data from query. */
    const tags = result.data.tagsGroup.group;

    /**
     * Create the tag pages using the tag template if there's at least one tag
     * defined in the frontmatter of blog posts.
     */
    if (tags.length > 0) {
        tags.forEach(tag => {
            createPage({
                path: `/tags/${tag.fieldValue}/`,
                component: tagTemplate,
                context: {
                    tag: tag.fieldValue,
                },
            });
        });
    }
};

exports.onCreateNode = ({ node, actions, getNode }) => {
    const { createNodeField } = actions;

    if (node.internal.type === "MarkdownRemark") {
        const value = createFilePath({ node, getNode });

        createNodeField({
            name: "slug",
            node,
            value,
        });
    }
};

exports.createSchemaCustomization = ({ actions }) => {
    const { createTypes } = actions;

    // Explicitly define the siteMetadata {} object
    // This way those will always be defined even if removed from gatsby-config.js

    // Also explicitly define the Markdown frontmatter
    // This way the "MarkdownRemark" queries will return `null` even when no
    // blog posts are stored inside "content/blog" instead of returning an error
    createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
    }

    type Fields {
      slug: String
    }
  `);
};
