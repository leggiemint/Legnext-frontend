import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

const PricingSection = () => {
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
          {config.stripe.plans.map((plan) => (
            <div key={plan.priceId} className="pricing-card">
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
                      ${plan.price}
                    </p>
                    <div className="flex flex-col justify-end mb-[4px]">
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        USD
                      </p>
                    </div>
                  </div>
                  
                  {plan.features && (
                    <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
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
                    <ButtonCheckout priceId={plan.priceId} />
                    
                    <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-500 font-medium relative">
                      Pay once. Access forever.
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
