import { Icons } from "../../icons";

/** Shared field styling, so every input on the page looks the same. */
export const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all";

/** Cover variants — wide banner for desktops, tighter crop for phones. */
export const COVER_VARIANTS = [
  {
    key: "desktop",
    label: "Desktop cover",
    ratio: "16:9",
    aspect: 16 / 9,
    icon: Icons.desktop,
    hint: "Wide banner shown on laptops and desktops",
  },
  {
    key: "mobile",
    label: "Mobile cover",
    ratio: "4:3",
    aspect: 4 / 3,
    icon: Icons.mobile,
    hint: "Taller crop shown on phones",
  },
];

/**
 * How each image slot is cropped. The avatar is a circle, the two covers are
 * the aspect ratios they are displayed at.
 */
export const CROP_SPECS = {
  avatar: {
    aspect: 1,
    circular: true,
    title: "Crop your profile photo",
    hint: "This is how your photo appears in the circular avatar.",
  },
  desktop: {
    aspect: 16 / 9,
    circular: false,
    title: "Crop your desktop cover",
    hint: "Shown on laptops and desktops.",
  },
  mobile: {
    aspect: 4 / 3,
    circular: false,
    title: "Crop your mobile cover",
    hint: "Shown on phones.",
  },
};

export const SOCIAL_FIELDS = [
  { key: "website", label: "Website" },
  { key: "x", label: "X (Twitter)" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

export const GENDERS = ["Male", "Female", "Other"];

/** The fields publishing depends on — everything else is optional. */
const REQUIRED_FOR_COMPLETION = [
  { key: "profession", label: "profession" },
  { key: "bio", label: "bio" },
  { key: "phone", label: "phone" },
  { key: "dob", label: "date of birth" },
  { key: "gender", label: "gender" },
];

export function emptyProfileForm() {
  return {
    profession: "",
    bio: "",
    phone: "",
    dob: "",
    gender: "",
    address: { country: "", state: "", city: "", zipCode: "" },
    socialLinks: {
      website: "",
      x: "",
      instagram: "",
      facebook: "",
      linkedin: "",
      youtube: "",
    },
  };
}

/** The form as it opens: the author's current profile. */
export function profileForm(author) {
  const empty = emptyProfileForm();
  if (!author) return empty;

  return {
    profession: author.profession || "",
    bio: author.bio || "",
    phone: author.phone || "",
    dob: author.dob ? new Date(author.dob).toISOString().slice(0, 10) : "",
    gender: author.gender || "",
    address: { ...empty.address, ...(author.address || {}) },
    socialLinks: { ...empty.socialLinks, ...(author.socialLinks || {}) },
  };
}

/** Which of the publishing-critical fields are still blank, if any. */
export function missingRequiredFields(form) {
  return REQUIRED_FOR_COMPLETION.filter(({ key }) => !String(form[key] || "").trim()).map(
    (field) => field.label,
  );
}

/**
 * The multipart body the API expects. Images are only attached when they
 * were actually changed on this visit, so saving other edits never re-uploads
 * a picture that is already stored.
 */
export function profileFormData(form, images = {}) {
  const body = new FormData();

  body.append("profession", form.profession);
  body.append("bio", form.bio);
  body.append("phone", form.phone);
  if (form.dob) body.append("dob", form.dob);
  if (form.gender) body.append("gender", form.gender);
  body.append("address", JSON.stringify(form.address));
  body.append("socialLinks", JSON.stringify(form.socialLinks));

  if (images.avatar) body.append("avatar", images.avatar, "avatar.jpg");
  if (images.desktop) {
    body.append("coverImage", images.desktop, "cover-desktop.jpg");
  }
  if (images.mobile) {
    body.append("coverImageMobile", images.mobile, "cover-mobile.jpg");
  }

  return body;
}
