import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "Site profile · Agentic CMS",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfileClient />;
}
