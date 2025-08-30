import MainLayout from "@/components/MainLayout";

export default function AIGeneratorPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">AI Avatar Generator</h1>
        <div className="grid gap-6">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Create PNGTuber with AI</h2>
              <p className="text-base-content/70">Generate custom PNGTuber avatars using AI prompts and styles.</p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Describe your character</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered h-24" 
                  placeholder="e.g., A cute anime girl with blue hair and cat ears..."
                ></textarea>
              </div>
              <div className="card-actions justify-end">
                <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">Generate Avatar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}