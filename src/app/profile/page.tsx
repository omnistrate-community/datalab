"use client"

import { useState, useEffect } from "react"
import { Save, Key, User, Bell, Palette } from "lucide-react"

interface UserProfile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  title?: string
  company?: string
  timezone: string
  theme: string
  language: string
  preferredLLMProvider: string
  hasApiKeys: {
    anthropic: boolean
    openai: boolean
  }
  emailNotifications: boolean
  agentNotifications: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    timezone: "UTC",
    theme: "SYSTEM",
    language: "en",
    preferredLLMProvider: "ANTHROPIC",
    emailNotifications: true,
    agentNotifications: true,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
          setFormData({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            title: data.profile.title || "",
            company: data.profile.company || "",
            timezone: data.profile.timezone,
            theme: data.profile.theme,
            language: data.profile.language,
            preferredLLMProvider: data.profile.preferredLLMProvider,
            emailNotifications: data.profile.emailNotifications,
            agentNotifications: data.profile.agentNotifications,
          })
        }
      }
    } catch {
      console.error("Failed to fetch profile:")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setMessage("Profile updated successfully!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to update profile")
      }
    } catch {
      setMessage("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account settings and preferences</p>
        </div>

          {message && (
            <div className="mx-6 mt-4 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Data Scientist, Analyst, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Palette className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Preferences</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="LIGHT">Light</option>
                    <option value="DARK">Dark</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Configuration */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Key className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">AI Configuration</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred LLM Provider</label>
                <select
                  value={formData.preferredLLMProvider}
                  onChange={(e) => setFormData({ ...formData, preferredLLMProvider: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ANTHROPIC">Anthropic Claude</option>
                  <option value="OPENAI">OpenAI GPT</option>
                  <option value="LOCAL">Local Processing</option>
                </select>
                {profile && (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    API Keys configured: 
                    {profile.hasApiKeys.anthropic && <span className="ml-1 text-green-600 dark:text-green-400">Anthropic</span>}
                    {profile.hasApiKeys.openai && <span className="ml-1 text-green-600 dark:text-green-400">OpenAI</span>}
                    {!profile.hasApiKeys.anthropic && !profile.hasApiKeys.openai && (
                      <span className="ml-1 text-yellow-600 dark:text-yellow-400">None (using local processing)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bell className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Email notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="agentNotifications"
                    type="checkbox"
                    checked={formData.agentNotifications}
                    onChange={(e) => setFormData({ ...formData, agentNotifications: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="agentNotifications" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Agent completion notifications
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
