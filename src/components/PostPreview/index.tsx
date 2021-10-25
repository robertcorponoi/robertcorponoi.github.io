import React from "react";
import { Link } from "gatsby";

import { Post } from "../../models/Post";

import PostPreviewTags from "../Post/PostTags";
import PostPreviewDate from "../Post/PostDate";
import PostPreviewTitle from "./PostPreviewTitle";
import PostPreviewDescription from "./PostPreviewDescription";

interface PostPreviewProps {
    /** The post data to display the preview of. */
    post: Post,
}

/**
 * A preview for a post that includes its featured image, title, short
 * description, and tags.
 * 
 * @param {PostPreviewProps} props
 */
const PostPreview = ({ post }: PostPreviewProps) => {
    return (
        <div key={post.frontmatter.title} className="flex flex-col overflow-hidden gap-y-1 py-8">
            <Link to={`${post.fields.slug}`} className="flex flex-col gap-y-1">
                <PostPreviewTitle title={post.frontmatter.title} />
                <PostPreviewDate date={post.frontmatter.date} />
            </Link>
            <PostPreviewTags tags={post.frontmatter.tags} />
            <PostPreviewDescription description={post.excerpt} />
        </div>
    );
};

export default PostPreview;
