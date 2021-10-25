import React from "react";

import Seo from "../components/Seo";
import Layout from "../components/Layout";

/** The page that shows when the user attempts to view an invalid URL. */
const NotFoundPage = () => {
    return (
        <Layout>
            <Seo title="404: Not Found" />
            <h1>404: Not Found</h1>
            <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
        </Layout>
    );
};

export default NotFoundPage;

