import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

/**
 * The CMS has no dashboard of its own yet, so the bare /admin/cms path used
 * to 404. Pages is the natural landing spot: it is the only screen that
 * shows every content type at once.
 */
export default function CmsIndex() {
  redirect("/admin/cms/pages");
}
