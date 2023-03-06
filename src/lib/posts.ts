import fs from "fs";
import path from "path";
import html from "remark-html";
import { remark } from "remark";
import matter from "gray-matter";
import prism from "remark-prism";

// The path to the posts directory.
// This is at the top level of the project, same as the `src` directory.
const postsDirectory = path.join(process.cwd(), "posts");

/**
 * Returns all of the posts sorted by their date.
 */
export const getSortedPostsData = (): { id: string; [key: string]: any }[] => {
    // Get file names under `/posts`.
    const fileNames = fs.readdirSync(postsDirectory);

    const allPostsData: { id: string; [key: string]: any }[] = fileNames.map(
        fileName => {
            // Remove ".md" from file name to get id.
            const id = fileName.replace(/\.md$/, "");

            // Read markdown file as string.
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, "utf8");

            // Use `gray-matter` to parse the post metadata section.
            const matterResult = matter(fileContents);

            // Combine the data with the id.
            return {
                id,
                ...matterResult.data,
            };
        }
    );

    // Sort posts by date.
    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
};

/**
 * Returns the ids of all of the posts.
 */
export const getAllPostIds = (): { params: { id: string } }[] => {
    const fileNames = fs.readdirSync(postsDirectory);

    return fileNames.map(fileName => {
        return {
            params: {
                id: fileName.replace(/\.md$/, ""),
            },
        };
    });
};

/**
 * Returns the data for a single post.
 *
 * @async
 *
 * @param {string} id The id of the post.
 */
export const getPostData = async (
    id: string
): Promise<{ id: string; contentHtml: string; [key: string]: any }> => {
    const fullPath = path.join(postsDirectory, `${id}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use `gray-matter` to parse the post metadata section.
    const matterResult = matter(fileContents);

    // Use `remark` to convert markdown into HTML string.
    const processedContent = await remark()
        .use(html, { sanitize: false })
        .use(prism)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    // Combine the data with the `id` and `contentHtml`.
    return {
        id,
        contentHtml,
        ...matterResult.data,
    };
};
