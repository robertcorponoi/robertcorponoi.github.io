import React from "react";

interface PostTitleProps {
    /** The title of the post. */
    title: string,
}

/**
 * The title of a post to be used in individual post pages.
 * 
 * @param {PostTitleProps} props
 */
const PostTitle = ({ title }: PostTitleProps) => <h1 itemProp="headline" className="text-5xl font-bold text-gray-900 dark:text-white">{title}</h1>;

export default PostTitle;
