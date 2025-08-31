import { NextRequest, NextResponse } from "next/server";
import { getPaymentConfig } from "@/config";

export async function GET(req: NextRequest) {
  const paymentConfig = getPaymentConfig();
  
  return NextResponse.json({
    serverSide: true,
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_PAYMENT_GATEWAY: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY,
      PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY,
      NODE_ENV: process.env.NODE_ENV,
    },
    config: {
      gateway: paymentConfig.gateway,
      planCount: paymentConfig.plans.length,
      plans: paymentConfig.plans.map(p => ({
        name: p.name,
        priceId: p.priceId,
        price: p.price,
        isFree: p.isFree
      }))
    }
  });
}