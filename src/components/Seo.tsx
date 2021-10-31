import React from "react";
import { Helmet } from "react-helmet";
import { useStaticQuery, graphql } from "gatsby";

interface SeoProps {
    /** An optional title for the page. */
    title?: string,
    /** An optional description for the page. */
    description?: string,
    /** Optional meta tags for the page. */
    meta?: any,
}

/**
 * Used to set the page title, description, and other meta tags for each
 * individual page.
 * 
 * @param {SeoProps} props
 */
const Seo = ({ title, description, meta }: SeoProps) => {
    /** The site data from the config. */
    const { site } = useStaticQuery(
        graphql`
      query {
        site {
          siteMetadata {
            title
            description
            social {
              twitter
            }
          }
        }
      }
    `
    );

    /** The description from the props or if it doesn't exist, from the query. */
    const metaDescription = description || site.siteMetadata.description;

    /** The default title of the page from the query. */
    const defaultTitle = site.siteMetadata?.title

    return (
        <Helmet
            htmlAttributes={{
                lang: "en",
            }}
            title={title}
            titleTemplate={defaultTitle ? `%s | ${defaultTitle}` : null}
            meta={[
                {
                    name: "description",
                    content: metaDescription,
                },
                {
                    property: "og:title",
                    content: title,
                },
                {
                    property: "og:description",
                    content: metaDescription,
                },
                {
                    property: "og:type",
                    content: `website`,
                },
                {
                    name: "twitter:card",
                    content: "summary",
                },
                {
                    name: "twitter:creator",
                    content: site.siteMetadata?.social?.twitter || "",
                },
                {
                    name: "twitter:title",
                    content: title,
                },
                {
                    name: "twitter:description",
                    content: metaDescription,
                },
            ].concat(meta || {})}
        />
    );
};

export default Seo;
