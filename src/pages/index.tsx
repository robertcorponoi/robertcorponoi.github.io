import Head from "next/head";
import Link from "next/link";
import { Inter } from "next/font/google";

import { Layout } from "@/components/Layout";
import { PostPreview } from "@/components/PostPreview";

import { getSortedPostsData } from "../lib/posts";

// The `Inter` font.
const inter = Inter({ subsets: ["latin"] });

/**
 * Returns the data for all of the posts.
 */
export const getStaticProps = (): {
    props: { allPostsData: { id: string; [key: string]: any }[] };
} => {
    const allPostsData = getSortedPostsData();
    return {
        props: {
            allPostsData,
        },
    };
};

/**
 * The home page displays a list of all of the blog posts ordered by date.
 */
const Home = ({
    allPostsData,
}: {
    allPostsData: { id: string; [key: string]: any }[];
}) => {
    return (
        <Layout>
            <Head>
                <title>Robert Corponoi</title>
                <meta
                    name="description"
                    content="Robert Corponoi website and blog."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>
            <div className="relative">
                <div className="relative max-w-7xl mx-auto">
                    <h1
                        aria-label="All posts"
                        className="sr-only dark:text-white"
                    >
                        All posts
                    </h1>
                    <div className="mt-2 flex flex-col divide-y-2 divide-dotted divide-gray-400">
                        {allPostsData.map(post => (
                            <PostPreview key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Home;
