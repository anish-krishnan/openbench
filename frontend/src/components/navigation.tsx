/**
 * Main navigation component
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { 
  Home, 
  Trophy, 
  Cpu, 
  FileText, 
  GitCompare, 
  Shield, 
  User, 
  LogOut,
  Menu,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Models', href: '/models', icon: Cpu },
  { name: 'Tests', href: '/tests', icon: FileText },
  { name: 'Compare', href: '/compare', icon: GitCompare },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Development bypass - mock authenticated user (only on client side to avoid hydration mismatch)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const mockSession = isClient ? {
    user: {
      id: 'dev-user',
      name: 'Developer',
      email: 'admin@example.com',
      role: 'admin'
    }
  } : null
  
  // Use mock session for development (only on client)
  const effectiveSession = session || mockSession
  const effectiveStatus = status === 'loading' ? 'loading' : (effectiveSession ? 'authenticated' : 'unauthenticated')

  const isAdmin = effectiveSession?.user?.email === 'admin@example.com' // Replace with proper role check

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary" />
          <span className="text-xl font-bold">OpenBench</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          
          {isAdmin && adminNavigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname.startsWith(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  Admin
                </Badge>
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <ConnectionStatus /> 
          {/* Contribute Button */}
          {effectiveSession && (
            <Button asChild size="sm" className="hidden md:flex">
              <Link href="/tests/new">
                <Plus className="mr-2 h-4 w-4" />
                Contribute
              </Link>
            </Button>
          )}

          {/* User Menu */}
          {effectiveStatus === 'loading' ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : effectiveSession ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={effectiveSession?.user?.avatar || effectiveSession?.user?.image || ''} 
                      alt={effectiveSession?.user?.name || 'User'} 
                    />
                    <AvatarFallback>
                      {effectiveSession?.user?.name?.charAt(0) || effectiveSession?.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {effectiveSession.user.name && (
                      <p className="font-medium">{effectiveSession.user.name}</p>
                    )}
                    {effectiveSession.user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {effectiveSession.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn()} size="sm">
              Sign in
            </Button>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  {adminNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Admin
                          </Badge>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </>
              )}
              {session && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tests/new" className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Contribute Test
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
