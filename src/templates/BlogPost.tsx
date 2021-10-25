import React from "react";
import { graphql } from "gatsby";

import Post from "../components/Post";

interface BlogPostTemplateProps {
    /** The data from the graphql query. */
    data: any,
    /** The location to pass to the layout. */
    location: any,
}

/**
 * The template used for all blog posts.
 * 
 * @param {BlogPostTemplateProps} props
 */
const BlogPostTemplate = (props: BlogPostTemplateProps) => {
    /** The post data. */
    const post = props.data.markdownRemark;

    return (
        <Post
            title={post.frontmatter.title}
            created={post.frontmatter.date}
            description={post.frontmatter.description}
            tags={post.frontmatter.tags}
            content={post.html}
            location={props.location}
        />
    );
};

export default BlogPostTemplate;

/** The query to retrieve the current, previous, and next blog posts. */
export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        tags
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
  }
`;
