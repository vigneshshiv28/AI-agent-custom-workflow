"use client"
import React from 'react'
import { Logo } from './logo'
import Link from 'next/link'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'



export const Navbar = () => {
  const pathname = usePathname()

  const navLinks = [
    {
      label: "Home",
      href: "/"
    },
    {
      label: "Product",
      href: "/product",
    },
    {
      label: "Agents",
      href: "/agents",
    },
    {
      label: "Workflows",
      href: "/workflows",
    }
  ];

  return (
    <nav className="flex items-center justify-between py-3 bg-black/95 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.25)] rounded-xl">
      <div className="flex items-center gap-8">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium transition-all duration-300 ${active
                  ? "bg-primary text-black font-semibold shadow-[0_2px_6px_rgba(0,255,200,0.45)]"
                  : "text-white hover:text-primary hover:scale-[1.08]"
                  }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          className="hover:text-primary transition-colors duration-300"
          href="/"
        >
          Login
        </Link>

        <Button className="bg-primary text-black font-semibold rounded-full px-4 py-1 hover:scale-[1.04] transition-all duration-300 shadow-[0_3px_8px_rgba(0,255,200,0.45)]">
          Sign Up
        </Button>
      </div>
    </nav>

  )
}