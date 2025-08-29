/**
 * Page shell component with navigation and footer
 */

import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

interface PageShellProps {
  children: React.ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary" />
              <span className="font-bold">OpenBench</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source LLM evaluation platform for the community.
            </p>
            <div className="flex space-x-2">
              <Link
                href="https://github.com/openbench/openbench"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com/openbench"
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/models" className="text-muted-foreground hover:text-foreground">
                  Models
                </Link>
              </li>
              <li>
                <Link href="/tests" className="text-muted-foreground hover:text-foreground">
                  Tests
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted-foreground hover:text-foreground">
                  Compare
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tests/new" className="text-muted-foreground hover:text-foreground">
                  Contribute
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="https://github.com/openbench/openbench/discussions" className="text-muted-foreground hover:text-foreground">
                  Discussions
                </Link>
              </li>
              <li>
                <Link href="https://discord.gg/openbench" className="text-muted-foreground hover:text-foreground">
                  Discord
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 OpenBench. Open source under MIT License.
            </p>
            <p className="text-sm text-muted-foreground mt-2 md:mt-0">
              Built with ❤️ by the community
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
