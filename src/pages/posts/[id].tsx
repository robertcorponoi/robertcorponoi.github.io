import Head from "next/head";

import { Date } from "../../components/Date";
import { Layout } from "../../components/Layout";

import { getAllPostIds, getPostData } from "../../lib/posts";

/**
 * Returns the data about a post including the id, date, title, and content to
 * be displayed.
 *
 * @async
 */
export const getStaticProps = async ({
    params,
}: {
    params: { [key: string]: string };
}) => {
    const postData = await getPostData(params.id);

    return {
        props: {
            postData,
        },
    };
};

/**
 * Returns the paths for all of the posts.
 */
export const getStaticPaths = () => {
    const paths = getAllPostIds();

    return {
        paths,
        fallback: false,
    };
};

type PostProps = {
    postData: {
        id: string;
        title: string;
        date: string;
        contentHtml: string;
    };
};

/**
 * The structure for every blog post.
 *
 * @param {PostProps} props
 */
const Post = ({ postData }: PostProps) => {
    return (
        <Layout>
            <Head>
                <title>{postData.title}</title>
            </Head>
            <article
                itemScope
                itemType="http://schema.org/Article"
                className="mt-8"
            >
                <div className="flex flex-col gap-y-2">
                    <h1
                        itemProp="headline"
                        className="text-5xl font-bold text-gray-900 dark:text-cyan-200"
                    >
                        {postData.title}
                    </h1>
                    <p className="text-gray-600 text-sm font-medium dark:text-gray-200">
                        <Date dateString={postData.date} />
                    </p>
                </div>

                <section
                    dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                    itemProp="articleBody"
                />
            </article>
        </Layout>
    );
};

export default Post;
