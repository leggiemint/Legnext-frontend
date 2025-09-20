import Image from "next/image";

const StepSection = () => {
  return (
    <section className="relative -my-12 py-8 flex justify-center bg-white z-20">
      <div className="relative max-w-6xl w-full mx-4">
        {/* Gradient border wrapper */}
        <div className="p-[2px] bg-gradient-to-r from-[#8b5cf6]/30 to-[#a855f7]/30 rounded-2xl">
          <div className="bg-white rounded-2xl">
            <Image 
              src="/images/Step.png" 
              alt="Step Process" 
              className="w-full h-auto rounded-2xl"
              width={800}
              height={0}
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepSection;
