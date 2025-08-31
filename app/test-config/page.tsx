"use client";

import { getPaymentConfig } from "@/config";

export default function TestConfigPage() {
  const paymentConfig = getPaymentConfig();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Configuration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">Environment Variables (Client-Side)</h2>
        <p>NEXT_PUBLIC_PAYMENT_GATEWAY: {process.env.NEXT_PUBLIC_PAYMENT_GATEWAY || 'undefined'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
      </div>
      
      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="font-bold">Payment Config Result</h2>
        <p>Gateway: {paymentConfig.gateway}</p>
        <p>Plan Count: {paymentConfig.plans.length}</p>
      </div>
      
      <div className="bg-green-100 p-4 rounded">
        <h2 className="font-bold">Available Plans</h2>
        {paymentConfig.plans.map((plan, index) => (
          <div key={index} className="border-b py-2">
            <p><strong>Name:</strong> {plan.name}</p>
            <p><strong>Price ID:</strong> {plan.priceId || 'undefined'}</p>
            <p><strong>Price:</strong> ${plan.price}</p>
            <p><strong>Credits:</strong> {plan.credits}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <button 
          onClick={() => console.log('Full config:', paymentConfig)} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Log Full Config to Console
        </button>
      </div>
    </div>
  );
}