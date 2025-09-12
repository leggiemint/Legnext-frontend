interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepsSectionProps {
  title: string;
  steps: Step[];
  className?: string;
}

const StepsSection = ({ title, steps, className = "" }: StepsSectionProps) => {
  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#4f46e5]">
            {title}
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 md:px-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col p-4 md:p-6 h-full bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#4f46e5] hover:translate-y-[-5px]">
              {/* Number Badge */}
              <div className="flex justify-center items-center mb-4 w-8 h-8 text-xl font-bold text-white bg-gradient-to-r from-[#4f46e5] to-[#6366f1] rounded-full md:w-14 md:h-14 md:text-2xl">
                {step.number}
              </div>
              
              {/* Content */}
              <div className="flex-grow">
                {/* Step Title */}
                <h3 className="mb-3 text-lg font-bold text-gray-900 md:text-xl">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm text-gray-600 md:text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
