/** Fixes a TypeScript issue of not being able to import images in React components. */
declare module "*.jpg" {
    export default undefined;
}
declare module "*.jpeg" {
    export default undefined;
}
declare module "*.png" {
    export default undefined;
}

/** Fixes a TypeScript error of not being able to import svgs in React components. */
declare module "*.svg" {
    import React = require("react");
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}