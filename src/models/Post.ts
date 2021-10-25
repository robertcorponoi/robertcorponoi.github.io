/**
 * The structure of a post as retrieved by graphql.
 */
export interface Post {
    excerpt: string,
    frontmatter: {
        title: string,
        date: string,
        description: string,
        tags: string[],
    },
    fields: {
        slug: string,
    },
}