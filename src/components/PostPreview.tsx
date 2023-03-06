import React from "react";
import Link from "next/link";

import { Date } from "@/components/Date";

type PostPreviewProps = {
    /** The post data. */
    post: { id: string; [key: string]: any };
};

/**
 * A preview for a post that includes its title and a short description about
 * the post.
 *
 * @param {PostPreviewProps} props
 */
export const PostPreview = ({ post }: PostPreviewProps) => {
    return (
        <div className="flex flex-col overflow-hidden gap-y-1 py-8">
            <Link href={`/posts/${post.id}`} className="flex flex-col gap-y-1">
                <h2 className="text-xl text-indigo-900 font-semibold dark:text-cyan-200">
                    {post.title}
                </h2>
                <Date dateString={post.date} />
            </Link>
            <p className="text-base text-gray-700 dark:text-gray-300 mt-2">
                {post.description}
            </p>
        </div>
    );
};
