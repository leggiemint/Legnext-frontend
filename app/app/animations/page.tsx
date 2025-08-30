export default function AnimationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Avatar Animations</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Blinking Animation</h2>
            <p className="text-base-content/70">Add natural blinking effects to your PNGTuber.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-sm">Preview</button>
              <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">Apply</button>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Mouth Movement</h2>
            <p className="text-base-content/70">Sync mouth movements with your voice.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-sm">Preview</button>
              <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}