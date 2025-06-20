import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const usageType = process.env.NEXT_PUBLIC_USAGE_TYPE || 'infrastructure';
    
    // Mock data based on usage type
    const mockData = {
      usageType,
      currentPeriod: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        daysRemaining: Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    };

    if (usageType === 'infrastructure') {
      return NextResponse.json({
        ...mockData,
        metrics: {
          cores: {
            current: 4 + Math.random() * 2,
            peak: 8 + Math.random() * 4,
            average: 3.2 + Math.random() * 1,
            limit: 16,
            unit: "cores",
            cost: 0.12
          },
          memory: {
            current: 12.5 + Math.random() * 5,
            peak: 24.8 + Math.random() * 10,
            average: 8.7 + Math.random() * 3,
            limit: 32,
            unit: "GB", 
            cost: 0.08
          },
          storage: {
            current: 150 + Math.random() * 50,
            peak: 180 + Math.random() * 60,
            average: 135 + Math.random() * 40,
            limit: 500,
            unit: "GB",
            cost: 0.02
          },
          bandwidth: {
            current: 2.3 + Math.random() * 1,
            peak: 5.1 + Math.random() * 2,
            average: 1.8 + Math.random() * 0.5,
            limit: 100,
            unit: "GB/day",
            cost: 0.05
          }
        }
      });
    } else {
      return NextResponse.json({
        ...mockData,
        metrics: {
          documents: {
            value: Math.floor(1000 + Math.random() * 500),
            limit: 5000,
            unit: "documents",
            cost: 0.001,
            trend: `+${Math.floor(5 + Math.random() * 15)}%`
          },
          agents: {
            value: Math.floor(3000 + Math.random() * 1000),
            limit: 10000,
            unit: "interactions",
            cost: 0.002,
            trend: `+${Math.floor(3 + Math.random() * 12)}%`
          },
          dataRows: {
            value: Math.floor(2000000 + Math.random() * 1000000),
            limit: 10000000,
            unit: "rows",
            cost: 0.000001,
            trend: `+${Math.floor(10 + Math.random() * 20)}%`
          },
          llmCalls: {
            value: Math.floor(2500 + Math.random() * 500),
            limit: 8000,
            unit: "API calls",
            cost: 0.01,
            trend: `+${Math.floor(2 + Math.random() * 8)}%`
          }
        }
      });
    }
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
