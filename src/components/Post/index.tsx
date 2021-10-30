import React, { useEffect, useRef } from "react";

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
    /** A ref to the article content, used to position the comments widget. */
    const articleRef = useRef<HTMLDivElement | null>(null);

    /**
     * When the component mounts we add the utterances script to the body and 
     * remove it on unmount.
     */
    useEffect(() => {
        if (articleRef && articleRef.current) {
            const script = document.createElement("script");

            script.setAttribute("src", "https://utteranc.es/client.js");
            script.setAttribute("repo", "robertcorponoi/robertcorponoi.github.io");
            script.setAttribute("issue-term", "pathname");
            script.setAttribute("theme", "github-dark");
            script.setAttribute("crossorigin", "anonymous");
            script.setAttribute("async", "true");

            console.log(script);

            articleRef.current.appendChild(script);

            return () => {
                articleRef.current.removeChild(script);
            };
        }
    }, [articleRef]);

    return (
        <Layout location={location}>
            <Seo title={title} description={description} />
            <article
                ref={articleRef}
                itemScope
                itemType="http://schema.org/Article"
                className="mt-8"
            >
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
