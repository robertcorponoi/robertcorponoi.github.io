import React from "react";

interface PostPreviewTitleProps {
    /** The title of the post. */
    title: string,
}

/**
 * The title of a post to be shown in a post preview.
 * 
 * @param {PostPreviewTitleProps} props
 */
const PostPreviewTitle = ({ title }: PostPreviewTitleProps) => <p className="text-xl text-indigo-900 font-semibold dark:text-gray-50">{title}</p>;

export default PostPreviewTitle;
