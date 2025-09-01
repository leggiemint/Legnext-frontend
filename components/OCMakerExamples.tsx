"use client";
import Image from "next/image";

const OCMakerExamples = () => {
  const examples = [
    {
      id: 1,
      image: "/images/example/DM_20250902052131_001.webp",
      alt: "Create a logo for a youtube channel for kids named 'bububerry'",
      description: "Create a logo for a youtube channel for kids named 'bububerry'"
      },
    {
      id: 2,
      image: "/images/example/DM_20250902052412_001.webp",
      alt: "1boy, blonde short hair, blue eyes, yellow scarf, blue hoodie with zipper, black pants, loafers, casual, looking at viewer",
      description: "1boy, blonde short hair, blue eyes, yellow scarf, blue hoodie with zipper, black pants, loafers, casual, looking at viewer"
    },
    {
      id: 3,
      image: "/images/example/DM_20250902052555_001.webp",
      alt: "A cel shaded Porsche 935 on a Tokyo freeway",
      description: "A cel shaded Porsche 935 on a Tokyo freeway"
    },
    {
      id: 4,
      image: "/images/example/DM_20250902052627_001.webp",
      alt: "happy woman cleaning, modern bright minimalist home, smiling, dusting surfaces, sunlight through large windows, warm natural lighting, cozy sleek interior, cinematic framing, vibrant realistic colors, ultra-detailed, 8k, hyperrealistic",
      description: "happy woman cleaning, modern bright minimalist home, smiling, dusting surfaces, sunlight through large windows, warm natural lighting, cozy sleek interior, cinematic framing, vibrant realistic colors, ultra-detailed, 8k, hyperrealistic"
    }
  ];

  return (
    <div className="py-10 md:py-16">
      <h2 className="mb-4 text-xl font-bold text-center md:mb-6 text-primary-900 md:text-3xl">
        Midjourney generated Examples
      </h2>
      <div className="grid grid-cols-2 gap-2 md:gap-10 lg:grid-cols-4">
        {examples.map((example) => (
          <div 
            key={example.id}
            className="flex overflow-hidden flex-col bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <Image 
              src={example.image}
              alt={example.alt}
              width={800}
              height={800}
              className="object-cover w-full h-full"
            />
            <div className="p-2 md:p-4 bg-primary-50 h-[170px] border-box">
              <p className="h-full text-xs font-medium text-primary-800 md:text-sm">
                {example.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OCMakerExamples;
