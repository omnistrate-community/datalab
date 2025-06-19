import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  language: z.string().optional(),
  preferredLLMProvider: z.enum(["ANTHROPIC", "OPENAI", "LOCAL"]).optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  agentNotifications: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        organization: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { profile, organization, ...userData } = user
    if (profile) {
      const { hashedPassword, anthropicApiKey, openaiApiKey, ...profileData } = profile
      // Remove unused variables warning
      void hashedPassword
      return NextResponse.json({
        user: userData,
        profile: {
          ...profileData,
          hasApiKeys: {
            anthropic: !!anthropicApiKey,
            openai: !!openaiApiKey,
          },
        },
        organization,
      })
    }

    return NextResponse.json({
      user: userData,
      profile: null,
      organization,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // Get or create user profile
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    let profile
    if (existingProfile) {
      profile = await prisma.userProfile.update({
        where: { userId: session.user.id },
        data,
      })
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          ...data,
        },
      })
    }

    // Remove sensitive data from response
    const { hashedPassword, anthropicApiKey, openaiApiKey, ...profileData } = profile
    // Remove unused variables warning  
    void hashedPassword

    return NextResponse.json({
      profile: {
        ...profileData,
        hasApiKeys: {
          anthropic: !!anthropicApiKey,
          openai: !!openaiApiKey,
        },
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
