import { motion } from "framer-motion";
import { Icons } from "../../icons";
import Avatar from "../ui/Avatar";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function EditProfileModal({
  formState,
  avatarPreview,
  avatarRef,
  onAvatarChange,
  saving,
  onSave,
  onClose,
}) {
  const {
    fullName,
    setFullName,
    profession,
    setProfession,
    bio,
    setBio,
    city,
    setCity,
    country,
    setCountry,
  } = formState;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-lg max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={avatarPreview} name={fullName} size="xl" className="w-20 h-20" />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <Icons.camera className="h-5 w-5" />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tap the avatar to change your profile photo.
            </p>
          </div>

          <Field label="Full Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Profession">
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Enter your profession"
              className={inputCls}
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Write a short bio about yourself"
              className={`${inputCls} resize-y`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className={inputCls}
              />
            </Field>
            <Field label="Country">
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
