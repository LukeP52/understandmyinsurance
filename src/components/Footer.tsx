import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const links = [
    { href: '/about', label: 'About Us' },
    { href: '/glossary', label: 'Insurance Glossary' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/careers', label: 'Careers' },
  ]

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 md:mb-0">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://snumps.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Snumps.com
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} Understand My Insurance. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
