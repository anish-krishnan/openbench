/**
 * Home page component
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HeroSection } from './hero-section'
import { QuickStats } from './quick-stats'
import { FeaturedTests } from './featured-tests'
import { TopModels } from './top-models'
import { RecentActivity } from './recent-activity'

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Quick Stats */}
      <section className="py-12 bg-muted/50">
        <div className="container">
          <QuickStats />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Tests */}
            <div className="lg:col-span-2">
              <FeaturedTests />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <TopModels />
              <RecentActivity />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Join the Community
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Help build the most comprehensive LLM evaluation platform. 
            Contribute tests, compare models, and advance AI research together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/tests/new">
                Contribute a Test
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
