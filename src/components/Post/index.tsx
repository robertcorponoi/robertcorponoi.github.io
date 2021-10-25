import React from "react";

import Seo from "../Seo";
import Layout from "../Layout";
import PostTags from "./PostTags";
import PostHeader from "./PostHeader";

interface PostProps {
    /** The title of the post. */
    title: string,
    /** The date that the post was created. */
    created: string,
    /** A short description of the post. */
    description: string,
    /** The tags of the post. */
    tags: string[],
    /** The contents of the post. */
    content: string,
    /** The location object. */
    location: URL,
}

/**
 * Displays the long form contents of a post.
 * 
 * @param {PostProps} props
 */
const Post = ({ title, created, description, tags, content, location }: PostProps) => {
    return (
        <Layout location={location}>
            <Seo title={title} description={description} />
            <article itemScope itemType="http://schema.org/Article" className="mt-8">
                <PostHeader title={title} date={created} />
                <PostTags tags={tags} />
                <section
                    dangerouslySetInnerHTML={{ __html: content }}
                    itemProp="articleBody"
                />
            </article>
        </Layout>
    );
};

export default Post;
