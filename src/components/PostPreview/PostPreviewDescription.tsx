import React from "react";

interface PostPreviewDescriptionProps {
    /** The description of the post. */
    description: string,
}

/**
 * The description of a post to be shown in a post preview.
 * 
 * @param {PostPreviewDescriptionProps} props
 */
const PostPreviewDescription = ({ description }: PostPreviewDescriptionProps) => <p className="text-base text-gray-700 dark:text-gray-300">{description}</p>;

export default PostPreviewDescription;
