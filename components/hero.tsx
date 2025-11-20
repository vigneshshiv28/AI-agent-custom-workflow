import React from "react";
import AgentFrameworkDiagram from "./agent-workflow-diagram";
import { Container } from "@/components/container";
import Heading from "@/components/heading";
import { CircleCheck } from "lucide-react";
import { ShimmerButton } from "./ui/shimmer-button";

import { Button } from "./ui/button";

const Hero = () => {
    return (
        <section className="relative py-14 space-y-8">
            <Container >
                <div className=" flex flex-col gap-6 max-w-xl
                            items-center text-center
                            md:items-start md:text-left">
                    <Heading as="h1" className=" font-mono font-semibold">
                        Your work, <br /> <span className="text-primary drop-shadow">Processed</span> for you <br /><span className="text-primary drop-shadow">Not</span> by you.
                    </Heading>
                    <p className="text-lg font-mono text-neutral-400 ">
                        Blend tools, logic and AI into workflows that run 24/7  <br /> even when you’re offline.
                    </p>
                    <div className="flex flex-col gap-4 md:flex-row">
                        <Button className="rounded-full text-black">Start building</Button>
                        <ShimmerButton className=" py-0 ">Talk to Agent</ShimmerButton>
                    </div>
                </div>



                <div className=" py-14 text-xs lg:text-xl text-neutral-400 space-y-6">
                    <div className="flex items-center gap-2 hover:text-neutral-200 transition-colors duration-300">
                        <CircleCheck />
                        <p>Build workflows visually no code required</p>
                    </div>
                    <div className="flex items-center gap-2 hover:text-neutral-200 transition-colors duration-300">
                        <CircleCheck />
                        <p>Run workflows on triggers, conditions or time</p>
                    </div>
                    <div className="flex items-center gap-2 hover:text-neutral-200 transition-colors duration-300">
                        <CircleCheck />
                        <p>Add any AI agent or app as a plug-in</p>
                    </div>
                </div>


                <AgentFrameworkDiagram
                    className=" absolute top-2 right-[-50px] w-[786px] lg:w-[1100px] 
                 rotate-[-30deg] skew-x-[30deg]
                -z-10"
                />
            </Container>
        </section>
    );
};

export default Hero;