import React from "react";
import { Link, graphql } from "gatsby";

import Seo from "../components/Seo";
import Layout from "../components/Layout";

interface TagsPageProps {
    /** The graphql query result. */
    data: {
        allMarkdownRemark: {
            group: {
                fieldValue: string,
                totalCount: number,
            }[],
        },
        site: {
            siteMetadata: {
                title: string,
            },
        },
    },
}

/**
 * Displays a list of all of the blog post tags and the posts that have that
 * tag.
 * 
 * @param {TagsPageProps} props
 */
const TagsPage = (props: TagsPageProps) => {
    return (
        <Layout>
            <Seo title="All Tags" />
            <div className="relative max-w-7xl mx-auto mt-4">
                <h1 className="mt-8 mb-4 text-gray-800 dark:text-gray-100 font-bold text-3xl">All Tags</h1>
                <div className="flex flex-col divide-y-2 divide-dotted divide-gray-400">
                    {
                        props.data.allMarkdownRemark.group.map(tag =>
                            <Link
                                to={`/tags/${tag.fieldValue}`}
                                className="py-2 block text-indigo-900 dark:text-gray-100"
                            >
                                {tag.fieldValue}
                            </Link>
                        )
                    }
                </div>
            </div>
        </Layout>
    );
};

export default TagsPage;

/** The query to get the tags data. */
export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(limit: 2000) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;