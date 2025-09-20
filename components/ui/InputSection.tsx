const InputSection = () => {
  return (
    <section className="relative -my-12 py-8 flex justify-center bg-white">
      <div className="relative max-w-2xl w-full mx-4">
        {/* Input field with gradient border */}
        <div className="p-[2px] bg-gradient-to-r from-[#8b5cf6]/30 to-[#a855f7]/30 rounded-2xl">
          <div className="bg-white rounded-2xl">
            <input
              type="text"
              placeholder="Enter your prompt here..."
              className="w-full px-6 py-4 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none rounded-2xl text-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InputSection;
