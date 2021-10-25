import React from "react";
import { Link } from "gatsby";

interface PostPreviewTagsProps {
    /** The tags of the post. */
    tags: string[],
}

/**
 * The title of a post to be shown in a post preview.
 * 
 * @param {PostPreviewTagsProps} props
 */
const PostPreviewTags = ({ tags }: PostPreviewTagsProps) => {
    return (
        <div className="flex items-center gap-x-2.5">
            {tags.map(tag => <Link key={tag} to={`/tags/${tag}`} className="text-sm text-indigo-900 dark:text-gray-100 rounded-full py-1">#{tag}</Link>)}
        </div>
    );
};

export default PostPreviewTags;
