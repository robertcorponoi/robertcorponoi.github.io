import Navbar from "./Navbar";

type LayoutProps = {
    /** The content to display. */
    children: React.ReactNode;
};

/**
 * The layout for every page.
 */
export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="h-full flex flex-col min-h-screen dark">
            <Navbar />
            <main className="h-full flex-1 sm:px-6 bg-white dark:bg-dark-100 pt-4">
                <div className="container w-11/12 md:w-10/12 lg:w-8/12 xl:w-6/12 mx-auto pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
