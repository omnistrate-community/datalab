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
  preferredLLMProvider: z.enum(["ANTHROPIC", "OPENAI", "VLLM", "LOCAL"]).optional(),
  preferredModelName: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  vllmEndpointUrl: z.string().optional(),
  vllmModelName: z.string().optional(),
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
      const { hashedPassword, anthropicApiKey, openaiApiKey, vllmEndpointUrl, vllmModelName, ...profileData } = profile
      // Remove unused variables warning
      void hashedPassword
      return NextResponse.json({
        user: userData,
        profile: {
          ...profileData,
          // Include vLLM configuration in response (not sensitive)
          vllmEndpointUrl,
          vllmModelName,
          hasApiKeys: {
            anthropic: !!anthropicApiKey,
            openai: !!openaiApiKey,
            vllm: !!vllmEndpointUrl,
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

    // First, verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { 
          error: "User session is invalid. Please sign out and sign back in.", 
          code: "USER_NOT_FOUND",
          action: "REAUTHENTICATE"
        },
        { status: 401 }
      )
    }

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
    const { hashedPassword, anthropicApiKey, openaiApiKey, vllmEndpointUrl, ...profileData } = profile
    // Remove unused variables warning  
    void hashedPassword

    return NextResponse.json({
      profile: {
        ...profileData,
        // Include vLLM endpoint URL in response (not sensitive)
        vllmEndpointUrl,
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

    // Handle Prisma foreign key constraint violations
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        code: (error as { code?: string }).code
      })
      
      if ((error as { code?: string }).code === 'P2003') {
        return NextResponse.json(
          { error: "User reference not found. Please try logging out and back in." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
