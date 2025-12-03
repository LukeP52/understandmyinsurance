'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface NavigationProps {
  onAuthClick?: () => void
}

export default function Navigation({ onAuthClick }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const menuLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/glossary', label: 'Insurance Glossary' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/careers', label: 'Careers' },
  ]

  return (
    <nav className="bg-white shadow-sm relative">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Hamburger menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-6 bg-black transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-black transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-black transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>

          <Link href="/" className="text-xl font-bold text-black hover:text-gray-700 transition-colors">
            Understand My Insurance
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Auth buttons */}
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">Welcome, {user.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-x-4 hidden sm:block">
              <button
                onClick={onAuthClick}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sign In
              </button>
              <button
                onClick={onAuthClick}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-64 bg-white shadow-lg border border-gray-200 rounded-b-lg z-50">
          <div className="py-2">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <a
              href="https://snumps.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Snumps.com
              <span className="ml-2 text-xs text-gray-400">↗</span>
            </a>

            {/* Mobile auth buttons */}
            <div className="sm:hidden border-t border-gray-200 my-2 pt-2">
              {user ? (
                <div className="px-4 py-2">
                  <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 space-y-2">
                  <button
                    onClick={() => {
                      onAuthClick?.()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onAuthClick?.()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  )
}
