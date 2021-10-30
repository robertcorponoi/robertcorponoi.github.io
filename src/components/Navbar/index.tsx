import React, { Fragment } from "react";
import { graphql, useStaticQuery } from "gatsby";
import { Github } from "@icons-pack/react-simple-icons";
import { Popover, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

import NavbarLink from "./NavbarLink";
import ThemeToggle from "./ThemeToggle";
import { MenuLink } from "../../models/MenuLink";

/** The main navigation of the site. */
const Navbar = () => {
    /** The query to get the links to add to the navbar. */
    const data = useStaticQuery(graphql`
    query MenuLinksQuery {
      site {
        siteMetadata {
          menuLinks {
              name,
              link
          }
        }
      }
    }
  `);

    /** The links to add to the navbar from the query. */
    const navbarLinks: MenuLink[] = data.site.siteMetadata?.menuLinks;

    return (
        <Popover className="relative shadow bg-white dark:bg-dark-100">
            <div className="flex justify-between items-center py-5 w-11/12 md:w-10/12 lg:w-8/12 xl:w-6/12 mx-auto">
                {/** Logo goes here. */}
                <div className="-mr-2 -my-2 md:hidden">
                    <Popover.Button className="rounded-full p-2 inline-flex items-center justify-center text-gray-800 hover:bg-gray-100 dark:text-gray-50 dark:hover:text-white dark:hover:bg-gray-800">
                        <span className="sr-only">Open menu</span>
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                    </Popover.Button>
                </div>
                <div className="hidden md:flex-1 md:flex md:items-center md:justify-between">
                    <Popover.Group as="nav" className="flex items-center">
                        <NavbarLink name="Home" link="/" />
                    </Popover.Group>
                    <div className="flex items-center gap-x-4 md:ml-12">
                        {
                            navbarLinks.map(navbarLink => <NavbarLink key={navbarLink.name} name={navbarLink.name} link={navbarLink.link} />)
                        }
                        <a href="https://github.com/robertcorponoi" target="_blank" rel="noopener noreferrer" className="py-2 px-4">
                            <Github className="w-6 h-6 text-gray-700 dark:text-gray-50" />
                        </a>
                        {/* <ThemeToggle /> */}
                    </div>
                </div>
            </div>

            <Transition
                as={Fragment}
                enter="duration-200 ease-out"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="duration-100 ease-in"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <Popover.Panel focus className="bg-white absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden dark:bg-dark-100 z-50">
                    <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 divide-y-2 divide-gray-100 dark:divide-gray-700">
                        <div className="py-4 px-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <NavbarLink name="Home" link="/" />
                                </div>
                                <div className="-mr-2">
                                    <Popover.Button className="rounded-full p-2 inline-flex items-center justify-center text-gray-700 hover:bg-gray-100 dark:text-gray-50 dark:hover:bg-gray-800">
                                        <span className="sr-only">Close menu</span>
                                        <XIcon className="h-6 w-6" aria-hidden="true" />
                                    </Popover.Button>
                                </div>
                            </div>
                        </div>
                        <div className="py-6 px-5">
                            <div className="flex flex-col">
                                {
                                    navbarLinks.map(navbarLink => <NavbarLink key={navbarLink.name} name={navbarLink.name} link={navbarLink.link} />)
                                }
                            </div>
                            <div className="mt-6">
                                <a href="https://github.com/robertcorponoi" target="_blank" rel="noopener noreferrer" className="block py-2 px-4">
                                    <Github className="w-6 h-6 text-gray-700 dark:text-gray-50" />
                                </a>
                            </div>
                        </div>
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>
    );
};

export default Navbar;
