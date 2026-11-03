import type { Metadata } from "next";
import ThreeDGame from "@/views/ThreeDGame";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "3D Game: Drive and Walk a Year-2040 City",
  description:
    "A playable 2040 city in the browser. Walk a humanoid, greet the crew, and take the controls of any truck, robotaxi, semi or cargo barge. Generated geometry, no downloads.",
  alternates: { canonical: "/3d-game" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/3d-game`,
    title: "3D Game: Drive and Walk a Year-2040 City",
    description:
      "Walk a humanoid, greet the crew, and drive anything in a browser-native 2040 city.",
  },
};

export default function Page() {
  return <ThreeDGame />;
}
