import fs from "fs";
import path from "path";
import html from "remark-html";
import { remark } from "remark";
import matter from "gray-matter";

const aboutPageDirectory = path.join(process.cwd(), "about");

/**
 * Returns the data for the about page.
 *
 * @async
 */
export const getAboutPageData = async (): Promise<{
    contentHtml: string;
    [key: string]: any;
}> => {
    const fullPath = path.join(aboutPageDirectory, "about.md");
    const fileContents = fs.readFileSync(fullPath, "utf8");

    // Use `gray-matter` to parse the post metadata section.
    const matterResult = matter(fileContents);

    // Use `remark` to convert markdown into HTML string.
    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
        contentHtml,
        ...matterResult.data,
    };
};
