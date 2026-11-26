// The Island game and Pocket Wilds are still plain files at the repo root. In dev they are served on port 8080
// (see .env.development); in the built site they are copied next to these pages, so the base is empty.
const base = (import.meta.env.VITE_LEGACY_BASE as string | undefined) ?? "";
export const legacy = (path: string) => base + path;

export const EMAIL = "pradhan.shrayash677@gmail.com";
export const SOCIAL = {
  github: "https://github.com/shrayash1",
  linkedin: "https://linkedin.com/in/shrayash-pradhan-17b905326",
  instagram: "https://www.instagram.com/shr_vector_arts/",
};

/** Copies text to the clipboard; if the browser refuses, selects the element's text instead. */
export function copyText(text: string, fallbackEl: HTMLElement | null): Promise<boolean> {
  const select = () => {
    if (!fallbackEl) return false;
    const r = document.createRange();
    r.selectNodeContents(fallbackEl);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    return false;
  };
  return navigator.clipboard ? navigator.clipboard.writeText(text).then(() => true, select) : Promise.resolve(select());
}
