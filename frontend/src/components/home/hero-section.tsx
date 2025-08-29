/**
 * Hero section component
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Cpu, 
  FileText, 
  GitCompare,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      <div className="container relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Beta badge */}
          <Badge variant="secondary" className="mb-6 px-3 py-1">
            <Sparkles className="mr-1 h-3 w-3" />
            Open Source & Community Driven
          </Badge>

          {/* Main headline */}
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Evaluate & Compare{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              LLMs
            </span>{' '}
            with Precision
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Open source platform for comprehensive LLM evaluation. 
            Create tests, benchmark models, and contribute to advancing AI research 
            with our community-driven approach.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/leaderboard">
                View Leaderboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/tests/new">
                Contribute Test
              </Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: Trophy,
                title: 'Global Leaderboard',
                description: 'Real-time rankings'
              },
              {
                icon: Cpu,
                title: 'Model Catalog',
                description: '50+ LLMs tested'
              },
              {
                icon: FileText,
                title: 'Test Library',
                description: '1000+ evaluations'
              },
              {
                icon: GitCompare,
                title: 'Side-by-side',
                description: 'Model comparison'
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
