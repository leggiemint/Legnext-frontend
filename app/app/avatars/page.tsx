export default function AvatarsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Avatars</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Avatar {i}</h2>
              <p className="text-sm text-base-content/70">Created on Date</p>
              <div className="card-actions justify-end">
                <button className="btn btn-ghost btn-sm">Edit</button>
                <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">Download</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}