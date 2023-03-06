import React from "react";
import Link from "next/link";
import Image from "next/image";

/** A styled link to use in the navbar. */
const NavbarLink = ({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) => (
    <Link
        className="block w-fit dark:text-gray-100 hover:dark:text-white hover:dark:bg-gray-800 rounded py-2.5 px-4"
        href={href}
    >
        {children}
    </Link>
);

/** The main navigation of the site. */
const Navbar = () => {
    return (
        <div className="w-full flex items-center dark:bg-dark-100 py-4">
            <div className="flex container w-11/12 md:w-10/12 lg:w-8/12 xl:w-6/12 mx-auto">
                <ul className="flex items-center gap-x-2 ml-auto">
                    <NavbarLink href="/">Home</NavbarLink>
                    <NavbarLink href="/about">About</NavbarLink>
                    <a
                        href="https://github.com/robertcorponoi"
                        target="_blank"
                        className="ml-2"
                    >
                        <Image
                            src="/github-mark-white.png"
                            alt="GitHub Logo"
                            width={24}
                            height={24}
                        />
                    </a>
                </ul>
            </div>
        </div>
    );
};

export default Navbar;
