"use client";

import config, { getPaymentConfig } from "@/config";
import ButtonCheckout from "./ButtonCheckout";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const PricingSection = () => {
  const { data: session } = useSession();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  
  // 获取当前支付网关配置
  const paymentConfig = getPaymentConfig();

  useEffect(() => {
    if (session?.user?.id) {
      // 获取用户数据
      fetch('/api/user/settings')
        .then(res => res.json())
        .then(data => {
          // 从getUserDashboardData返回的结构中提取数据
          const plan = data?.user?.plan || 'free';
          const subscriptionStatus = data?.user?.subscriptionStatus || 'inactive';
          const hasAccess = data?.user?.hasAccess || false;
          
          setUserPlan(plan);
          
          // 设置完整的订阅状态信息
          setSubscriptionStatus({
            subscriptionStatus,
            isActive: subscriptionStatus === 'active' && hasAccess,
            plan,
            hasAccess
          });
        })
        .catch(err => {
          console.error('Failed to fetch user settings:', err);
          setUserPlan('free'); // Fallback
        });
    }
  }, [session?.user?.id]);

  return (
    <section className="py-20 md:py-24 bg-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your PNGTuber Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start creating professional PNGTuber avatars today. Choose the plan that fits your streaming needs.
          </p>
        </div>
        

        
        {/* Pricing Cards - Only Free and Pro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {paymentConfig.plans.map((plan, index) => (
            <div key={plan.priceId || `plan-${index}`} className="pricing-card">
              <div className="relative w-full max-w-lg mx-auto">
                {plan.isFeatured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <span className="badge text-xs text-white font-semibold border-0 px-3 py-1 rounded-full" style={{ backgroundColor: config.colors.main }}>
                      POPULAR
                    </span>
                  </div>
                )}

                {plan.isFeatured && (
                  <div className="absolute -inset-[1px] rounded-[9px] z-10" style={{ backgroundColor: config.colors.main }}></div>
                )}

                <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-lg lg:text-xl font-bold text-gray-900">{plan.name}</p>
                      {plan.description && (
                        <p className="text-gray-600 mt-2">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {plan.priceAnchor && (
                      <div className="flex flex-col justify-end mb-[4px] text-lg">
                        <p className="relative">
                          <span className="absolute bg-gray-400 h-[1.5px] inset-x-0 top-[53%]"></span>
                          <span className="text-gray-500">
                            ${plan.priceAnchor}
                          </span>
                        </p>
                      </div>
                    )}
                    <p className="text-5xl tracking-tight font-extrabold text-gray-900">
                      {plan.isFree ? "Free" : `$${plan.price}`}
                    </p>
                    {!plan.isFree && (
                      <div className="flex flex-col justify-end mb-[4px]">
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          USD
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {plan.features && (
                    <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={`${plan.name}-feature-${i}`} className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-[18px] h-[18px] text-[#06b6d4] shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="space-y-2">
                    {/* 🎯 智能显示当前计划状态 - 基于完整状态验证 */}
                    {session && userPlan === plan.name.toLowerCase() && 
                     (plan.name.toLowerCase() === 'free' || 
                      (plan.name.toLowerCase() === 'pro' && subscriptionStatus?.subscriptionStatus === 'active' && subscriptionStatus?.hasAccess)) ? (
                      <div className="relative">
                        {/* Current Plan Badge */}
                        <div 
                          className="btn btn-block text-white cursor-default flex items-center justify-center gap-2 font-semibold"
                          style={{ backgroundColor: '#22c55e' }}
                        >
                          <svg 
                            className="w-5 h-5" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          Current Plan
                        </div>
                        
                        {/* 额外状态信息 */}
                        {subscriptionStatus && plan.name.toLowerCase() === 'pro' && (
                          <div className="mt-2 text-xs text-center">
                            {subscriptionStatus.subscriptionStatus === 'active' ? (
                              <span className="text-green-600 font-medium">
                                ✓ Active Subscription
                                {subscriptionStatus.daysRemaining > 0 && (
                                  <span className="text-gray-500 ml-1">
                                    ({subscriptionStatus.daysRemaining} days left)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">
                                ⚠ Subscription {subscriptionStatus.subscriptionStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        {/* 🚫 Pro用户防重复订阅检查 */}
                        {session && userPlan === 'pro' && subscriptionStatus?.subscriptionStatus === 'active' && plan.name.toLowerCase() === 'pro' ? (
                          <div className="btn btn-block bg-gray-400 text-white cursor-not-allowed opacity-75">
                            Already Subscribed
                          </div>
                        ) : (
                          <ButtonCheckout 
                            priceId={plan.priceId} 
                            isFree={plan.isFree}
                            mode="subscription"
                          />
                        )}
                      </div>
                    )}
                    
                    <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-500 font-medium relative">
                      {plan.isFree ? "No credit card required" : "/month"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ Link */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm mb-4">
            Have questions about our pricing?
          </p>
          <a 
            href="/contact" 
            className="font-medium hover:underline"
            style={{ color: config.colors.main }}
          >
            Contact our sales team →
          </a>
        </div>
        
      </div>
    </section>
  );
};

export default PricingSection;
