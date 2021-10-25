import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import Seo from "../components/Seo";
import PostPreview from "../components/PostPreview";

interface TagsProps {
    /** The tag data. */
    pageContext: {
        tag: string,
    },
    /** The tag posts data. */
    data: {
        allMarkdownRemark: {
            totalCount: number,
            edges: {
                node: {
                    excerpt: string,
                    frontmatter: {
                        title: string,
                        date: string,
                        description: string,
                        tags: string[],
                    },
                    fields: {
                        slug: string,
                    },
                },
            }[],
        },
    },
}

/** 
 * Displays a tag and the posts that have that tag.
 * 
 * @param {TagsProps} props
 */
const Tags = (props: TagsProps) => {
    /** The tag data. */
    const { tag } = props.pageContext;

    /** The post data and total number of posts. */
    const { edges, totalCount } = props.data.allMarkdownRemark;

    /** The name of the tag with the first letter capitalized. */
    const tagNameNormalized = tag[0].toUpperCase() + tag.slice(1);

    return (
        <Layout>
            <Seo title={tagNameNormalized} />
            <div className="relative max-w-7xl mx-auto mt-4">
                <h1 className="mt-8 text-gray-800 dark:text-gray-100 font-bold text-3xl">{tagNameNormalized}</h1>
                <div className="flex flex-col divide-y-2 divide-dotted divide-gray-400">
                    {edges.map(post => <PostPreview key={post.node.frontmatter.title} post={post.node} />)}
                </div>
                <Link to="/tags" className="text-lg text-indigo-900 dark:text-gray-100 underline">All Tags</Link>
            </div>
        </Layout>
    );
};

export default Tags;

/** The query to get the tags and their post data. */
export const pageQuery = graphql`
    query($tag: String) {
        allMarkdownRemark(
            limit: 2000
            sort: { fields: [frontmatter___date], order: DESC }
            filter: { frontmatter: { tags: { in: [$tag] } } }
        ) {
            totalCount
            edges {
                node {
                    excerpt
                    fields {
                        slug
                    }
                    frontmatter {
                        title
                        date
                        description
                        tags
                    }
                }
            }
        }
    }
`;