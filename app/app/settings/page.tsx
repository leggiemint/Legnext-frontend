import ButtonAccount from "@/components/ButtonAccount";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="grid gap-6">
        {/* Account Settings */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Account Management</h2>
            <p className="text-base-content/70">Manage your subscription, billing, and account details.</p>
            <div className="mt-4">
              <ButtonAccount />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Preferences</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default Avatar Style</span>
                </label>
                <select className="select select-bordered w-full max-w-xs">
                  <option>Anime</option>
                  <option>Realistic</option>
                  <option>Cartoon</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Enable notifications</span>
                  <input type="checkbox" className="checkbox" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}