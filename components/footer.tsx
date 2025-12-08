
import { Github, Twitter, Linkedin } from "lucide-react";
import { Logo } from "@/components/logo"
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className=" border-neutral-800 bg-neutral-950 py-12">

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                    <Logo />
                    <p className="text-neutral-500 text-sm">
                        © {new Date().getFullYear()} AgentWorkflow Inc. All rights reserved.
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                        <Twitter className="w-5 h-5" />
                    </Link>
                    <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                        <Github className="w-5 h-5" />
                    </Link>
                    <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                        <Linkedin className="w-5 h-5" />
                    </Link>
                </div>
            </div>

        </footer>
    );
};
