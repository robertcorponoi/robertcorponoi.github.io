import React from "react";

/**
 * The footer for the site, which contains common links, links to social media,
 * and other information.
 */
const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-300 py-4 dark:bg-dark-100 dark:border-t-0">
            <div className="container lg:w-9/12 mx-auto">
                <p className="text-sm text-gray-800 text-center py-4 dark:text-gray-50">© {new Date().getFullYear()}, Robert Corponoi. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
