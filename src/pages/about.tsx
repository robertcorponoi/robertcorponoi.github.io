import React from "react";

import Seo from "../components/Seo";
import Layout from "../components/Layout";

/**
 * Displays a short bio about myself.
 */
const Bio = () => {
    return (
        <Layout>
            <Seo title="About Me" />
            <div className="relative max-w-7xl mx-auto mt-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-50 mb-4">Robert Corponoi</h1>
                <div className="flex flex-col gap-y-6 leading-7">
                    <div className="flex flex-col gap-y-2">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">About Me</p>
                        <p className="text-gray-800 dark:text-gray-200">
                            I'm a full-stack developer by day and hobby game developer
                            by night currently living in the Seattle area. I'm
                            interested in user experience, system architecture,
                            and scalable state management. I have experience
                            working in large codebases and on performance
                            critical collaborative applications.
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                            Now days I mostly work with React and TypeScript. I'm also
                            mildly fond of TailwindCSS for reducing CSS code complexity
                            and Storybook for documenting components and their use
                            cases. In my spare time I enjoy working with Rust game
                            engines and contributing to several open and closed source
                            game repositories.
                        </p>
                    </div>
                    <div className="flex flex-col gap-y-2 leading-7">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Experience</p>
                        <ul className="list-inside list-disc text-gray-800 dark:text-gray-200">
                            <li>Currently Senior Front-End Developer at <a href="https://zverse.com/" target="_blank">ZVerse</a>.</li>
                            <li>Former Full-Stack Developer at The Refinery, LeafFilter, and Tracker.</li>
                            <li>Open source game developer and contributor.</li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-y-2 leading-7">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Technologies & Philosophy</p>
                        <p className="text-gray-800 dark:text-gray-200">
                            Although I take on the Full-Stack roles my expertise
                            lies in Front-End technologies such as TypeScript,
                            React, and CSS (including CSS pre-processors and
                            frameworks such as TailwindCSS).
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                            I enjoy dabbling in Rust development and more
                            specifically, game development in Rust using engines
                            such as Godot and Bevy.
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                            I put most of my focus on developing open source
                            solutions and contributing to open source as I find it
                            very rewarding and I enjoy helping other developers
                            create their passion projects.
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                            When it comes to development, I focus on clean,
                            maintainable code which is thoroughly documented and
                            tested.I always try to find the right tool for the job
                            even if it means failing until I do so.
                        </p>
                    </div>
                    <div className="flex flex-col gap-y-2 leading-7">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Hobbies</p>
                        <p className="text-gray-800 dark:text-gray-200">
                            When not working, developing a game, or deciding
                            whether to create a game engine or CMS, I enjoy going
                            on hikes, playing video games, or relaxing at a local
                            brewery.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Bio;
