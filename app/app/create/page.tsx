export default function CreatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Avatar</h1>
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">AI Avatar Generator</h2>
          <p>Create your custom PNGTuber avatar with AI assistance.</p>
          <div className="card-actions justify-end">
            <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">Start Creating</button>
          </div>
        </div>
      </div>
    </div>
  );
}