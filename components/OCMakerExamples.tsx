import Image from "next/image";
"use client";

const OCMakerExamples = () => {
  const examples = [
    {
      id: 1,
      image: "/images/example/komiko_girl.webp",
      alt: "Appearance: 1girl, blonde hair, very long curly hair, purple eyes, purple hoodie, black pleated skirt, black socks, black sneakers, black wings, looking at viewer",
      description: "Appearance: 1girl, blonde hair, very long curly hair, purple eyes, purple hoodie, black pleated skirt, black socks, black sneakers, black wings, looking at viewer"
    },
    {
      id: 2,
      image: "/images/example/komiko_boy.webp",
      alt: "Appearance: 1boy, blonde hair, short hair, blue eyes, yellow scarf, blue hoodie, zipper, casual clothes, black pants, loafers, black shoes, looking at viewer",
      description: "Appearance: 1boy, blonde hair, short hair, blue eyes, yellow scarf, blue hoodie, zipper, casual clothes, black pants, loafers, black shoes, looking at viewer"
    },
    {
      id: 3,
      image: "/images/example/cat_girl.webp",
      alt: "Appearance: 1girl, cat ears, green eyes, twin tails, mint hair, long hair, green outfit, leaf motif, thigh-highs, leafy accessory, holding bow, vines, cat tail, genshin impact style",
      description: "Appearance: 1girl, cat ears, green eyes, twin tails, mint hair, long hair, green outfit, leaf motif, thigh-highs, leafy accessory, holding bow, vines, cat tail, genshin impact style"
    },
    {
      id: 4,
      image: "/images/example/boy.webp",
      alt: "Appearance: 1boy, red and black hair, undercut, glowing eyes, blue eyes, robotic arm, black coat, sword, holding weapon, combat boots, electricity",
      description: "Appearance: 1boy, red and black hair, undercut, glowing eyes, blue eyes, robotic arm, black coat, sword, holding weapon, combat boots, electricity"
    }
  ];

  return (
    <div className="py-10 md:py-16">
      <h2 className="mb-4 text-xl font-bold text-center md:mb-6 text-primary-900 md:text-3xl">
        PngTuber Maker Examples
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
