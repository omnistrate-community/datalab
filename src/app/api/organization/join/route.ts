import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const joinOrgSchema = z.object({
  inviteCode: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { inviteCode } = joinOrgSchema.parse(body)

    // Check if user already has an organization
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (existingUser?.organizationId) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 400 }
      )
    }

    // For this implementation, we'll use the organization slug as invite code
    // In a real app, you'd have a separate invites table
    const organization = await prisma.organization.findUnique({
      where: { slug: inviteCode },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      )
    }

    // Update user to join the organization
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        organizationId: organization.id,
        role: "USER",
      },
    })

    return NextResponse.json({ organization }, { status: 200 })
  } catch (error) {
    console.error("Join organization error:", error)
    
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
