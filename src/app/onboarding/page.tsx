"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Onboarding() {
  const { update } = useSession()
  const [organizationName, setOrganizationName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"create" | "join">("create")
  const [inviteCode, setInviteCode] = useState("")
  const router = useRouter()

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/organization/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: organizationName,
        }),
      })

      if (response.ok) {
        // Update session to include organization
        await update()
        router.push("/workspace")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create organization")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/organization/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode,
        }),
      })

      if (response.ok) {
        // Update session to include organization
        await update()
        router.push("/workspace")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to join organization")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to DataLab
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let&apos;s get you set up with an organization to start processing your data
          </p>
        </div>
        
        <div className="mt-8">
          {/* Mode Selection */}
          <div className="flex rounded-md shadow-sm mb-6">
            <button
              onClick={() => setMode("create")}
              className={`relative w-1/2 border border-gray-300 py-2 px-4 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                mode === "create"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              Create Organization
            </button>
            <button
              onClick={() => setMode("join")}
              className={`relative w-1/2 border border-gray-300 py-2 px-4 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                mode === "join"
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              Join Organization
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {mode === "create" ? (
            <form onSubmit={handleCreateOrganization} className="space-y-6">
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                  Organization name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Acme Corp"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be your organization&apos;s workspace for data processing and collaboration.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Organization"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinOrganization} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter invitation code"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the invitation code provided by your organization administrator.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Joining..." : "Join Organization"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
