import Head from "next/head";

import { Layout } from "@/components/Layout";

import { getAboutPageData } from "@/lib/about";

/**
 * Returns the data for the about page.
 *
 * @async
 */
export const getStaticProps = async (): Promise<{
    props: { aboutPageData: { [key: string]: any } };
}> => {
    const aboutPageData = await getAboutPageData();
    return {
        props: {
            aboutPageData,
        },
    };
};

/**
 * The about page displays a short bio and links to my social media accounts.
 */
const About = ({
    aboutPageData,
}: {
    aboutPageData: { [key: string]: any };
}) => {
    return (
        <Layout>
            <Head>
                <title>Robert Corponoi | About Me</title>
            </Head>
            <h1 className="text-5xl font-bold dark:text-cyan-200 mb-4">
                About Me
            </h1>
            <section
                dangerouslySetInnerHTML={{ __html: aboutPageData.contentHtml }}
                itemProp="articleBody"
            />
        </Layout>
    );
};

export default About;
