import * as React from "react";
import { graphql } from "gatsby";

import { Post } from "../models/Post";

import Seo from "../components/Seo";
import Layout from "../components/Layout";
import PostPreview from "../components/PostPreview";

interface IndexProps {
    /** The data from the graphql query. */
    data: {
        site: {
            siteMetadata: {
                title: string,
            },
        },
        allMarkdownRemark: {
            nodes: Post[],
        },
    },
}

/**
 * The landing page.
 * 
 * @param {IndexProps} props
 */
const Index: React.FC<IndexProps> = (props: IndexProps) => {
    /** The title of the site. */
    const siteTitle = props.data.site.siteMetadata?.title || "Title"; 

    /** The posts from the `content` directory. */
    const posts = props.data.allMarkdownRemark.nodes;

    return (
        <Layout>
            <Seo title={siteTitle} />
            <div className="relative">
                <div className="relative max-w-7xl mx-auto">
                    <div className="mt-2 flex flex-col divide-y-2 divide-dotted divide-gray-400">
                        {posts.map(post => <PostPreview key={post.frontmatter.title} post={post} />)}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Index;

/** The query to get the site title and posts. */
export const pageQuery = graphql`
    query {
        site {
            siteMetadata {
                title
            }
        }
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
            nodes {
                excerpt
                fields {
                    slug
                }
                frontmatter {
                    date(formatString: "MMMM DD, YYYY")
                    title
                    description
                    tags
                }
            }
        }
    }
`;
