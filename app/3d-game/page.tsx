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
  // WebApplication rather than VideoGame: the thing being described is a
  // browser-native interactive built from generated geometry, and the
  // engineering is the point. BreadcrumbList gives the page a parent so it is
  // not an orphan in the graph, and the FAQ answers the two questions people
  // actually arrive with, which is what gets quoted by assistants.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${SITE_URL}/3d-game#app`,
      name: "3D Game: Drive and Walk a Year-2040 City",
      url: `${SITE_URL}/3d-game`,
      applicationCategory: "GameApplication",
      operatingSystem: "Any browser with WebGL",
      browserRequirements: "Requires WebGL. No plugin or download.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${SITE_URL}/#person` },
      description:
        "A playable 2040 city in the browser. Walk a humanoid, greet the crew, and take the controls of any truck, robotaxi, semi or cargo barge. Every robot, vehicle and tower is generated geometry, so the whole city ships as code with nothing downloaded.",
      featureList: [
        "Walk a humanoid with arrow keys or WASD, run with shift",
        "Greet other units and they wave back",
        "Take the controls of any vehicle or cargo barge",
        "Formula-style cockpit wheel with forward, reverse, booster and autopilot",
        "Traffic that yields, queues and keeps its spacing",
        "Entirely procedural geometry, no downloaded assets",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "3D Game", item: `${SITE_URL}/3d-game` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do I need to download or install anything to play it?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. It runs in any browser with WebGL. Every robot, vehicle, tower and barge is generated in code rather than loaded as a model file, so there are no assets to download and the whole city ships as JavaScript.",
          },
        },
        {
          "@type": "Question",
          name: "How is a browser 3D city built without downloading 3D models?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Every object is procedural geometry composed at runtime from primitives and extruded profiles with three.js. Vehicles are built from extruded side profiles with separately shaped cabins and wheel arches, humanoids from a jointed rig driven by pose functions, and traffic follows arc-length curves so spacing holds over a long session instead of drifting into a pile-up.",
          },
        },
      ],
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThreeDGame />
    </>
  );
}
