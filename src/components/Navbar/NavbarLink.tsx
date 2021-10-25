import React from "react";
import { Link } from "gatsby";

import { MenuLink } from "../../models/MenuLink";

/**
 * A link to be displayed in the navbar.
 * 
 * @param {MenuLink} props
 */
const NavbarLink = ({ name, link }: MenuLink) => <Link to={link} className="text-gray-800 hover:text-gray-700 dark:text-gray-50 dark:hover:text-white py-2 px-4">{name}</Link>;

export default NavbarLink;
