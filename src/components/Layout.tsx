import React from "react";
import "@fontsource/aclonica";

import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * The layout of the entire site.
 */
const Layout: React.FC<any> = ({ children, location }) => {
    return (
        <div className="h-full flex flex-col min-h-screen">
            <Navbar />
            <main className="h-full flex-1 sm:px-6 bg-white dark:bg-dark-900">
                <div className="container w-11/12 md:w-10/12 lg:w-8/12 xl:w-6/12 mx-auto pb-8">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
