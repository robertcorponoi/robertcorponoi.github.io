import React from "react";

import PostDate from "./PostDate";
import PostTitle from "./PostTitle";

interface PostHeaderProps {
    /** The title of the post. */
    title: string,
    /** The date that the post was created. */
    date: string,
}

/**
 * The header of the post contains the featured image, title, author
 * information, and tags.
 * 
 * @param {PostHeaderProps} props
 */
const PostHeader = ({ title, date }: PostHeaderProps) => {
    return (
        <div className="flex flex-col gap-y-2">
            <PostTitle title={title} />
            <PostDate date={date} />
        </div>
    );
};

export default PostHeader;
