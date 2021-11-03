module.exports = {
    /** General information about the website that can be queried in pages/components. */
    siteMetadata: {
        /** The name of the website. */
        title: "Robert Corponoi",
        /** Information about the author of the website. */
        author: {
            name: "Robert Corponoi",
            summary: "Just another JavaScript developer",
        },
        /** A brief description of the site. */
        description: "My personal blog",
        /** The URL of the site. */
        siteUrl: "https://robertcorponoi.com",
        /** Social media unique identifiers. */
        social: {
            twitter: "robertcorponoi",
        },
        /** The links that should appear in the navbar. */
        menuLinks: [
            {
                name: "React",
                link: "/tags/react",
            },
            {
                name: "Game Development",
                link: "/tags/game-development",
            },
            {
                name: "Blog",
                link: "/tags/blog",
            },
            {
                name: "About Me",
                link: "/about",
            },
        ],
    },
    plugins: [
        /**
         * Provides drop-in support for PostCSS.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-postcss/
         */
        "gatsby-plugin-postcss",
        /**
         * Enables us to add responsive images to the site while maintaining
         * high performance scores.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-image/
         */
        "gatsby-plugin-image",
        /**
         * Processes images in markdown so they can be used in the production
         * build.
         * https://www.gatsbyjs.com/plugins/gatsby-remark-images/
         */
        "gatsby-remark-images",
        {
            resolve: "gatsby-source-filesystem",
            options: {
                path: `${__dirname}/content/blog`,
                name: `blog`,
            },
        },
        {
            resolve: "gatsby-source-filesystem",
            options: {
                path: `${__dirname}/content/tutorials`,
                name: `blog`,
            },
        },
        /**
         * Lets us write JSX embedded inside markdown.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-mdx/
         */
        {
            resolve: "gatsby-plugin-mdx",
            options: {
                extensions: [".mdx", ".md"],
            },
            gatsbyRemarkPlugins: [
                {
                    resolve: `gatsby-remark-images`,
                    options: {
                        maxWidth: 590,
                    },
                },
            ],
            plugins: ["gatsby-remark-images"],
        },
        /**
         * A Gatsby source plugin for sourcing data into the Gatsby
         * application from the local filesystem.
         * https://www.gatsbyjs.com/plugins/gatsby-source-filesystem/
         */
        {
            resolve: "gatsby-source-filesystem",
            options: {
                name: "images",
                path: `${__dirname}/src/images`,
            },
        },
        /**
         * Parse Markdown files using remark.
         * https://www.gatsbyjs.com/plugins/gatsby-transformer-remark/
         */
        {
            resolve: "gatsby-transformer-remark",
            options: {
                plugins: [
                    {
                        resolve: "gatsby-remark-images",
                        options: {
                            maxWidth: 630,
                        },
                    },
                    {
                        resolve: "gatsby-remark-responsive-iframe",
                        options: {
                            wrapperStyle: "margin-bottom: 1.0725rem",
                        },
                    },
                    "gatsby-remark-prismjs",
                    "gatsby-remark-copy-linked-files",
                    "gatsby-remark-smartypants",
                ],
            },
        },
        /**
         * Creates `ImageSharp` nodes from image types that are supported by
         * the Sharp image processing library.
         * https://www.gatsbyjs.com/plugins/gatsby-transformer-sharp/
         */
        "gatsby-transformer-sharp",
        /**
         * Exposes several image processing function built on the Sharp image 
         * processing library. It is a low-level plugin generally used by other
         * Gatsby plugins.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-sharp/
         */
        "gatsby-plugin-sharp",
        /**
         * Creates a RSS feed for the site.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-feed/
         */
        {
            resolve: `gatsby-plugin-feed`,
            options: {
                query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
                feeds: [
                    {
                        serialize: ({ query: { site, allMarkdownRemark } }) => {
                            return allMarkdownRemark.nodes.map(node => {
                                return Object.assign({}, node.frontmatter, {
                                    description: node.excerpt,
                                    date: node.frontmatter.date,
                                    url: site.siteMetadata.siteUrl + node.fields.slug,
                                    guid: site.siteMetadata.siteUrl + node.fields.slug,
                                    custom_elements: [{ "content:encoded": node.html }],
                                })
                            })
                        },
                        query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  nodes {
                    excerpt
                    html
                    fields { 
                      slug 
                    }
                    frontmatter {
                      title
                      date
                    }
                  }
                }
              }
            `,
                        output: "/rss.xml",
                        title: "Robert Corponoi RSS Feed",
                        // optional configuration to insert feed reference in pages:
                        // if `string` is used, it will be used to create RegExp and then test if pathname of
                        // current page satisfied this regular expression;
                        // if not provided or `undefined`, all pages will have feed reference inserted
                        match: "^/blog/",
                    },
                ],
            },
        },
        /**
         * Provides drop-in support for server rendering data added with React
         * Helmet.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-react-helmet/
         */
        "gatsby-plugin-react-helmet",
        /**
         * Adds canonical links to HTML pages Gatsby generates.
         * https://www.gatsbyjs.com/plugins/gatsby-plugin-canonical-urls/
         */
        {
            resolve: "gatsby-plugin-canonical-urls",
            options: {
                siteUrl: "https://www.robertcorponoi.com",
            },
        },
    ],
};
