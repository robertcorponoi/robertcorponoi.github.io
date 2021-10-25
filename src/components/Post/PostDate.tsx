import React from "react";

interface PostDateProps {
    /** The date of the post. */
    date: string,
}

/**
 * The date of a post to be shown in a post or post preview.
 * 
 * @param {PostDateProps} props
 */
const PostPreviewDate = ({ date }: PostDateProps) =>
    <p className="text-gray-600 text-sm font-medium dark:text-gray-200">{date}</p>

export default PostPreviewDate;
