import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      disableVllm: process.env.DISABLE_VLLM === 'true',
      staticVllmEndpoint: process.env.STATIC_VLLM_ENDPOINT || null,
      vllmModelName: process.env.VLLM_MODEL_NAME || 'meta-llama/Llama-3.1-8B-Instruct'
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to get environment config:', error);
    return NextResponse.json(
      { error: 'Failed to get environment config' },
      { status: 500 }
    );
  }
}
