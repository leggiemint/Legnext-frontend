
import Image from 'next/image'
import logo from '@/app/logo.svg'

const ImageShowcase = () => {
  return (
    <section className="py-16 relative bg-white w-screen -mx-4 sm:-mx-6 lg:-mx-8 z-10">
      {/* Centered text overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/10">
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-3 shadow-lg">
              <Image
                src={logo}
                alt="Legnext Logo"
                width={120}
                height={30}
                className="h-6 w-auto"
                priority={true}
              />
            </div>
            
            {/* Main text with gradient */}
            <h2 className="text-white text-2xl md:text-3xl font-bold text-center">
              — Bring <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] bg-clip-text text-transparent">Midjourney-Powered Generation</span> to Any App
            </h2>
          </div>
        </div>
      </div>
      
      <div className="overflow-hidden w-full">
        {/* First row: Left to Right */}
        <div className="flex mb-4 whitespace-nowrap">
          <div className="flex gap-4 flex-shrink-0 animate-[scroll-left_30s_linear_infinite]">
            {/* First set of images */}
            {[
              '/images/example/0_640_n.WEBP',
              '/images/example/0_640_n(1).WEBP',
              '/images/example/0_640_n(2).WEBP',
              '/images/example/0_640_n(3).WEBP',
              '/images/example/0_640_n(4).WEBP',
              '/images/example/0_640_n(5).WEBP',
              '/images/example/0_640_n(6).WEBP',
              '/images/example/0_640_n(7).WEBP',
              '/images/example/0_640_n(8).WEBP',
              '/images/example/0_640_n(9).WEBP',
              '/images/example/0_640_n(10).WEBP',
              '/images/example/1.WEBP',
              '/images/example/2.WEBP',
              '/images/example/3.WEBP',
              '/images/example/4.WEBP',
              '/images/example/5.WEBP',
            ].concat([
              '/images/example/0_640_n.WEBP',
              '/images/example/0_640_n(1).WEBP',
              '/images/example/0_640_n(2).WEBP',
              '/images/example/0_640_n(3).WEBP',
              '/images/example/0_640_n(4).WEBP',
              '/images/example/0_640_n(5).WEBP',
              '/images/example/0_640_n(6).WEBP',
              '/images/example/0_640_n(7).WEBP',
              '/images/example/0_640_n(8).WEBP',
              '/images/example/0_640_n(9).WEBP',
              '/images/example/0_640_n(10).WEBP',
              '/images/example/1.WEBP',
              '/images/example/2.WEBP',
              '/images/example/3.WEBP',
              '/images/example/4.WEBP',
              '/images/example/5.WEBP',
            ]).map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Example ${index + 1}`}
                width={160}
                height={160}
                className="w-40 h-40 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Second row: Right to Left */}
        <div className="flex whitespace-nowrap">
          <div className="flex gap-4 flex-shrink-0 animate-[scroll-right_30s_linear_infinite]">
            {/* First set of images */}
            {[
              '/images/example/0_640_n(11).WEBP',
              '/images/example/0_640_n(12).WEBP',
              '/images/example/0_640_n(13).WEBP',
              '/images/example/0_640_n(14).WEBP',
              '/images/example/0_640_n(15).WEBP',
              '/images/example/0_640_n(16).WEBP',
              '/images/example/0_640_n(17).WEBP',
              '/images/example/0_640_n(18).WEBP',
              '/images/example/0_640_n(19).WEBP',
              '/images/example/0_640_n(20).WEBP',
              '/images/example/0_640_n(21).WEBP',
              '/images/example/6.WEBP',
              '/images/example/7.WEBP',
              '/images/example/8.WEBP',
              '/images/example/9.WEBP',
              '/images/example/10.WEBP',
            ].concat([
              '/images/example/0_640_n(11).WEBP',
              '/images/example/0_640_n(12).WEBP',
              '/images/example/0_640_n(13).WEBP',
              '/images/example/0_640_n(14).WEBP',
              '/images/example/0_640_n(15).WEBP',
              '/images/example/0_640_n(16).WEBP',
              '/images/example/0_640_n(17).WEBP',
              '/images/example/0_640_n(18).WEBP',
              '/images/example/0_640_n(19).WEBP',
              '/images/example/0_640_n(20).WEBP',
              '/images/example/0_640_n(21).WEBP',
              '/images/example/6.WEBP',
              '/images/example/7.WEBP',
              '/images/example/8.WEBP',
              '/images/example/9.WEBP',
              '/images/example/10.WEBP',
            ]).map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Example ${index + 17}`}
                width={160}
                height={160}
                className="w-40 h-40 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ImageShowcase