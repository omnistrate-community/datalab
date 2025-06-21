"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  User, 
  Settings, 
  LogOut, 
  Building2, 
  ChevronDown,
  Database,
  Zap
} from "lucide-react"

interface UserProfile {
  firstName?: string
  lastName?: string
  title?: string
  company?: string
  preferredLLMProvider: string
  preferredModelName?: string
  vllmEndpointUrl?: string
  vllmModelName?: string
  hasApiKeys: {
    anthropic: boolean
    openai: boolean
    vllm: boolean
  }
}

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
}

interface NavbarProps {
  className?: string
}

export function Navbar({ className = "" }: NavbarProps) {
  const { data: session } = useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
        setOrganization(data.organization)
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  if (!session) {
    return null
  }

  const displayName = userProfile?.firstName 
    ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
    : session.user.name || session.user.email

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link href="/workspace" className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">DataLab</span>
            </Link>
            
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/workspace"
                className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Workspace
              </Link>
              <Link
                href="/usage"
                className="text-gray-500 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Usage & Billing
              </Link>
            </nav>
          </div>

          {/* Organization and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Organization Info */}
            {organization && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{organization.name}</span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {organization.plan}
                </span>
              </div>
            )}

            {/* LLM Provider Status */}
            {userProfile && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
                <Zap className={`h-4 w-4 ${
                  userProfile.hasApiKeys.anthropic || userProfile.hasApiKeys.openai || userProfile.hasApiKeys.vllm
                    ? 'text-green-500' 
                    : 'text-yellow-500'
                }`} />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-700">
                    {userProfile.preferredLLMProvider === 'ANTHROPIC' && 'Claude'}
                    {userProfile.preferredLLMProvider === 'OPENAI' && 'OpenAI'}
                    {userProfile.preferredLLMProvider === 'VLLM' && 'vLLM'}
                    {userProfile.preferredLLMProvider === 'LOCAL' && 'Local'}
                  </span>
                  {userProfile.preferredModelName && (
                    <span className="text-xs text-gray-500">
                      {userProfile.preferredModelName}
                    </span>
                  )}
                  {userProfile.preferredLLMProvider === 'VLLM' && userProfile.vllmModelName && (
                    <span className="text-xs text-gray-500">
                      {userProfile.vllmModelName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:block">{displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-gray-500">{session.user.email}</div>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
