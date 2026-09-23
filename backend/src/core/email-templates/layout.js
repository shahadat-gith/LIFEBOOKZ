/**
 * Shared shell for every LifeBookz email.
 *
 * Deliberately plain: one white card on the app's soft background, the deep
 * navy brand bar on top, coral reserved for the single action button. Email
 * clients are unforgiving, so the markup is table-free styling on simple
 * blocks with inline styles only.
 */

const BRAND = {
  primary: "#172554",
  accent: "#f43f5e",
  background: "#f8f9fd",
  foreground: "#101b3c",
  muted: "#5f6c84",
  border: "#e3e8f2",
};

export function layout({ preheader = "", heading, body, cta }) {
  const ctaBlock = cta
    ? `<a href="${cta.href}" style="display:inline-block;margin-top:24px;background:${BRAND.accent};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px">${cta.label}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BRAND.background};font-family:Inter,Helvetica,Arial,sans-serif;color:${BRAND.foreground}">
    <span style="display:none;visibility:hidden;opacity:0">${preheader}</span>
    <div style="max-width:520px;margin:0 auto;padding:32px 16px">
      <div style="font-size:15px;font-weight:700;letter-spacing:-0.2px;color:${BRAND.primary};padding-bottom:16px">
        Life<span style="color:${BRAND.accent}">bookz</span>
      </div>

      <div style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;padding:32px">
        <h1 style="margin:0;font-size:20px;line-height:1.35;font-weight:700;color:${BRAND.foreground}">${heading}</h1>
        <div style="margin-top:16px;font-size:14px;line-height:1.7;color:${BRAND.muted}">${body}</div>
        ${ctaBlock}
      </div>

      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted}">
        You received this email because you have a LifeBookz account.<br />
        &copy; ${new Date().getFullYear()} LifeBookz. All rights reserved.
      </p>
    </div>
  </body>
</html>`;
}

export { BRAND };
