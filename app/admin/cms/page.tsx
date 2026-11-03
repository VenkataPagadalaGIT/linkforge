import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

/**
 * The post editor is the only content screen left under /admin/cms. Pages,
 * SEO fields and edits live in the one CMS described in cms/README.md.
 */
export default function CmsIndex() {
  redirect("/admin/cms/posts");
}
