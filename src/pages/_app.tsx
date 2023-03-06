import "@/styles/globals.css";
import "prismjs/themes/prism-tomorrow.css";

import type { AppProps } from "next/app";

/**
 * Used to initialize pages. The `Component` prop is the active page.
 */
const App = ({ Component, pageProps }: AppProps) => {
    return <Component {...pageProps} />;
};

export default App;
