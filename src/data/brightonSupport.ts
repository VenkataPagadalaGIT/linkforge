/**
 * brightonSupport.ts: the people who carried the brightonSEO San Diego 2026
 * talk on LinkedIn, for the thank-you page at
 * /research-and-talks/brightonseo-san-diego-2026.
 *
 * GENERATED below the types by scripts/brightonseo-support/export_public.py
 * from the capture in ~/Desktop/brightonSEO_SD26_Support: public, signed-out
 * sources only. Do not edit the data by hand; change the script and rerun.
 *
 * Only posts that name Venkata in the brightonSEO context. Counts are what
 * LinkedIn showed on the capture date and keep moving. Members-only posts carry
 * a name, a date and a link: never a quote, a count or a screenshot.
 */

export type SupportPhase = "before" | "day" | "after" | "next";

export interface SupportPost {
  id: string;
  author: string;
  authorType: "person" | "page";
  headline: string;
  /** Local time in San Diego, read from the LinkedIn post id. */
  posted: string;
  phase: SupportPhase;
  reactions: number | null;
  comments: number | null;
  /** False: LinkedIn shows the post to signed-in members only. */
  public: boolean;
  url: string;
  /** One sentence in the author's own words; null for members-only posts. */
  quote: string | null;
  image: { src: string; width: number; height: number } | null;
}

export interface MyTalkPost {
  label: string;
  posted: string;
  reactions: number;
  comments: number;
  url: string;
  /** LinkedIn's public embed of the post, cropped to the card. */
  image?: { src: string; width: number; height: number } | null;
}

/** One name on the thank-you list, linked to its LinkedIn profile or page. */
export interface ThankYou {
  name: string;
  url: string;
}

export const SUPPORT_POSTS: SupportPost[] = [
  {
    "id": "7503377621326491649",
    "author": "Tyson Stockton",
    "authorType": "person",
    "headline": "Co-Founder & COO at Previsible | SEO → AI Discovery | Advisor, Recruiter &…",
    "posted": "2026-09-09T02:03",
    "phase": "before",
    "reactions": 26,
    "comments": 2,
    "public": true,
    "url": "https://www.linkedin.com/posts/tysonstockton_brightonseo-2026-meet-and-greet-ugcPost-7503377621326491649-ShH9/",
    "quote": "I'm also moderating Sessions 3 through 5 on Track 1 on Tuesday and catching Venkata Pagadala Tuesday morning, and Jordan Koene on Wednesday.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7503377621326491649.webp",
      "width": 720,
      "height": 1207
    }
  },
  {
    "id": "7503463479006085121",
    "author": "Jean-Christophe Chouinard",
    "authorType": "person",
    "headline": "Senior SEO Strategist at Tripadvisor, ex SEEK, ex Jobillico. Certified Data…",
    "posted": "2026-09-09T07:45",
    "phase": "before",
    "reactions": 43,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/jeanchristophechouinard_had-a-chance-to-have-an-early-preview-of-share-7503463479006085121-NZrS/",
    "quote": "Had a chance to have an early preview of Venkata Pagadala's talk at BrightonSEO, and you definitely don't want to miss this.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7503463479006085121.webp",
      "width": 720,
      "height": 841
    }
  },
  {
    "id": "7504158622214713355",
    "author": "Parth Suba",
    "authorType": "person",
    "headline": "Human-led AI Search & SEO Systems Architect",
    "posted": "2026-09-11T05:47",
    "phase": "before",
    "reactions": 85,
    "comments": 13,
    "public": true,
    "url": "https://www.linkedin.com/posts/parthsuba77_who-is-heading-to-brightonseo-san-diego-next-share-7504158622214713355-MG51/",
    "quote": "My dear friend, my man Venkata Pagadala, is speaking in the very first session of the conference",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504158622214713355.webp",
      "width": 720,
      "height": 1397
    }
  },
  {
    "id": "7504180805749870592",
    "author": "Smith Shah",
    "authorType": "person",
    "headline": "Building Growth Engines @Schbang | SEO, Content, CRO & Analytics | Designing…",
    "posted": "2026-09-11T07:15",
    "phase": "before",
    "reactions": 65,
    "comments": 5,
    "public": true,
    "url": "https://www.linkedin.com/posts/smith-shah3107_if-you-are-heading-to-brightonseo-san-diego-activity-7504180807519977473-LMzY",
    "quote": "My friend My guy and an absolute excellent SEO Venkata Pagadala is opening the very first session of the entire conference, and I couldn't be more proud to say that.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504180805749870592.webp",
      "width": 720,
      "height": 1530
    }
  },
  {
    "id": "7504180780173082626",
    "author": "Kunjal Chawhan",
    "authorType": "person",
    "headline": "Sr SEO Manager & Innovation Lead at Botpresso | Python SEO Practitioner 🐍",
    "posted": "2026-09-11T07:15",
    "phase": "before",
    "reactions": 37,
    "comments": 2,
    "public": true,
    "url": "https://www.linkedin.com/posts/kunjal-chawhan_brightonseo-san-diego-2026-schedule-activity-7504180780173082626-Yqhs",
    "quote": "This year I'm excited for my friend Venkata Pagadala 🫡",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504180780173082626.webp",
      "width": 720,
      "height": 1152
    }
  },
  {
    "id": "7504191982194442240",
    "author": "Anjul Singhvi",
    "authorType": "person",
    "headline": "Digital Marketing Manager | Strategic & Data Driven SEO Professional",
    "posted": "2026-09-11T07:59",
    "phase": "before",
    "reactions": 7,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/anjul-singhvi-seo-digital-marketing_heading-to-brightonseo-san-diego-next-week-share-7504191982194442240-7PD2/",
    "quote": "Venkata Pagadala is taking the stage in the conference's opening session to present \"Industrial level classification with intent.\"",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504191982194442240.webp",
      "width": 720,
      "height": 1087
    }
  },
  {
    "id": "7504219680488800257",
    "author": "Amal Alexander",
    "authorType": "person",
    "headline": "Business Manager at Performics | AI & ML in SEO | Publicis Groupe",
    "posted": "2026-09-11T09:49",
    "phase": "before",
    "reactions": 18,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/amal-alexander-305780131_brightonseo-san-diego-2026-schedule-activity-7504219680488800257-wtsw",
    "quote": "My brother Venkata Pagadala is heading to brightonSEO San Diego next week, and honestly, I couldn't be more excited for him.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504219680488800257.webp",
      "width": 720,
      "height": 1559
    }
  },
  {
    "id": "7504229185645776896",
    "author": "Mihir Naik",
    "authorType": "person",
    "headline": "Senior Product Manager, AI @ Building seoClarity ArcAI - AEO/GEO/AI SEO…",
    "posted": "2026-09-11T10:27",
    "phase": "before",
    "reactions": 80,
    "comments": 3,
    "public": true,
    "url": "https://www.linkedin.com/posts/mihir23192_few-months-back-venkata-pagadala-showed-share-7504229185645776896-F4Lf/",
    "quote": "Few months back, Venkata Pagadala showed me classification work that he did on top of all the keywords, and I was blown away.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504229185645776896.webp",
      "width": 720,
      "height": 798
    }
  },
  {
    "id": "7504401287434747904",
    "author": "Sagar Kumar",
    "authorType": "person",
    "headline": "SEO | Blogger | Automation | Building @SEOmation.net",
    "posted": "2026-09-11T21:51",
    "phase": "before",
    "reactions": 25,
    "comments": 3,
    "public": true,
    "url": "https://www.linkedin.com/posts/hackit-sagar_seo-technicalseo-searchintent-share-7504401287434747904-yA82/",
    "quote": "Some people teach you SEO. Some people teach you how to think. For me, Venkata Pagadala has always been the second kind.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7504401287434747904.webp",
      "width": 720,
      "height": 1325
    }
  },
  {
    "id": "7505028613419929600",
    "author": "Balvinder Singh",
    "authorType": "person",
    "headline": "Lead Technical Product Manager @ AT&T | AI, GenAI & Automation | LLMs, RAG…",
    "posted": "2026-09-13T15:24",
    "phase": "before",
    "reactions": 9,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/balvinder-singh-10bb4a225_brightonseo-seo-technicalseo-share-7505028613419929600-AUeV/",
    "quote": "Excited to see Venkata Pagadala speaking at brightonSEO San Diego 2026!",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505028613419929600.webp",
      "width": 720,
      "height": 1097
    }
  },
  {
    "id": "7505171629438554112",
    "author": "Gaurav Patil",
    "authorType": "person",
    "headline": "B2B SaaS SEO Consultant",
    "posted": "2026-09-14T00:52",
    "phase": "before",
    "reactions": 12,
    "comments": 2,
    "public": true,
    "url": "https://www.linkedin.com/posts/gaurav-patil-seo_how-much-of-our-seo-strategy-is-still-decided-share-7505171629438554112-NsDn/",
    "quote": "My friend Venkata Pagadala is speaking at brightonSEO San Diego, and I liked a point he shared ahead of his talk: “Search volume is a direction, not a strategy.”",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505171629438554112.webp",
      "width": 720,
      "height": 980
    }
  },
  {
    "id": "7505207705075224578",
    "author": "Vipul Mahrishi",
    "authorType": "person",
    "headline": "SEO & Organic Growth Specialist | Technical SEO | AEO/GEO | Driving B2B SaaS…",
    "posted": "2026-09-14T03:15",
    "phase": "before",
    "reactions": 2,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/vipul-mahrishi_excited-to-see-my-friend-venkata-pagadala-share-7505207705075224578-D81K/",
    "quote": "Excited to see my friend Venkata Pagadala speaking at brightonSEO San Diego tomorrow on Industrial Level Classification with Intent 😃",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505207705075224578.webp",
      "width": 720,
      "height": 1124
    }
  },
  {
    "id": "7505681691353640960",
    "author": "Raymond Martinez",
    "authorType": "person",
    "headline": "Vice President SEO @ Archer Education | Media Management",
    "posted": "2026-09-15T10:39",
    "phase": "day",
    "reactions": 49,
    "comments": 6,
    "public": true,
    "url": "https://www.linkedin.com/posts/raymond-martinez-seo_shout-out-to-venkata-pagadala-at-brightonseo-ugcPost-7505681691353640960-GVHj/",
    "quote": "Shout out to Venkata Pagadala at brightonSEO. His work is interesting, challenging, and gets you to think deeply about search.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505681691353640960.webp",
      "width": 720,
      "height": 934
    }
  },
  {
    "id": "7505684231650672641",
    "author": "Link Building HQ",
    "authorType": "page",
    "headline": "",
    "posted": "2026-09-15T10:49",
    "phase": "day",
    "reactions": 21,
    "comments": 2,
    "public": true,
    "url": "https://www.linkedin.com/posts/heroconf-ugcPost-7505684231650672641-SBqp/",
    "quote": "Real SEO opportunities hide in the data. Venkata Pagadala unpacked 5.8M queries to find them, live in Track 1.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505684231650672641.webp",
      "width": 720,
      "height": 770
    }
  },
  {
    "id": "7505705151278530560",
    "author": "George Nguyen",
    "authorType": "person",
    "headline": "Let me edit your content.",
    "posted": "2026-09-15T12:12",
    "phase": "day",
    "reactions": 90,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/george-c-nguyen_venkata-pagadala-great-session-mom-would-share-7505705151278530560-Jy6v/",
    "quote": "Venkata Pagadala great session, mom would be proud 🥹🙏🏼",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505705151278530560.webp",
      "width": 720,
      "height": 794
    }
  },
  {
    "id": "7505829903225950209",
    "author": "Derek Hyman, MPH",
    "authorType": "person",
    "headline": "Helping behavioral health operators own their admissions pipeline | SEO + AI…",
    "posted": "2026-09-15T20:28",
    "phase": "day",
    "reactions": 26,
    "comments": 7,
    "public": true,
    "url": "https://www.linkedin.com/posts/derekhymanmph_its-pretty-awesome-to-have-one-of-the-best-ugcPost-7505829903225950209-B4pW/",
    "quote": "Got to spend a few minutes catching up with Michael Johnson Venkata Pagadala Noah McKeown Preston B.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505829903225950209.webp",
      "width": 720,
      "height": 1177
    }
  },
  {
    "id": "7506380235593035777",
    "author": "Sanjay Singh",
    "authorType": "person",
    "headline": "Building radarkit.ai - First UI based AI Search tracker that uses real user…",
    "posted": "2026-09-17T08:55",
    "phase": "after",
    "reactions": 100,
    "comments": 6,
    "public": true,
    "url": "https://www.linkedin.com/posts/sanjaysingh7727_its-a-wrap-we-had-an-awesome-time-at-ugcPost-7506380235593035777-iX9Y/",
    "quote": "We had an awesome time at Brightonseo San diego! … Great meeting : … Venkata Pagadala … and many others!",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506380235593035777.webp",
      "width": 720,
      "height": 1153
    }
  },
  {
    "id": "7506435669020372992",
    "author": "Raymond Martinez",
    "authorType": "person",
    "headline": "Vice President SEO @ Archer Education | Media Management",
    "posted": "2026-09-17T12:35",
    "phase": "after",
    "reactions": 76,
    "comments": 14,
    "public": true,
    "url": "https://www.linkedin.com/posts/raymond-martinez-seo_theres-something-special-about-this-seo-ugcPost-7506435669020372992-BNGC/",
    "quote": "It was great seeing the new voices take the stage. Natasha Post and Venkata Pagadala killed.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506435669020372992.webp",
      "width": 720,
      "height": 1587
    }
  },
  {
    "id": "7506548990558175232",
    "author": "Harinath Babu",
    "authorType": "person",
    "headline": "AI SEO & GEO Professional | Gen AI‐Enabled Digital Marketing Strategist | AEO…",
    "posted": "2026-09-17T20:05",
    "phase": "after",
    "reactions": 9,
    "comments": 1,
    "public": true,
    "url": "https://www.linkedin.com/posts/harinathbabu_seo-geo-aeo-share-7506548990558175232-1qcy/",
    "quote": "That’s one of the ideas that really stood out to me from Venkata Pagadala at brightonSEO San Diego 2026 presentation “User First, Algorithm Second.”",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506548990558175232.webp",
      "width": 720,
      "height": 3548
    }
  },
  {
    "id": "7506779557631422464",
    "author": "Noah Learner",
    "authorType": "person",
    "headline": "Mentor + Superconnector + Operator | Innovation @ Sterling Sky | Founder of…",
    "posted": "2026-09-18T11:21",
    "phase": "after",
    "reactions": 80,
    "comments": 29,
    "public": true,
    "url": "https://www.linkedin.com/posts/noahlearner_brightonseo-share-7506779557631422464-ZX43/",
    "quote": "Sitting in the audience I could see it happening in real time while watching Natasha Post and Venkata Pagadala do their first big talks. I'm SO SO proud of you both!!!",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506779557631422464.webp",
      "width": 720,
      "height": 1496
    }
  },
  {
    "id": "7506824067698728960",
    "author": "Laurie Bell",
    "authorType": "person",
    "headline": "Head of Client Success @ Grandir",
    "posted": "2026-09-18T14:18",
    "phase": "after",
    "reactions": 35,
    "comments": 5,
    "public": true,
    "url": "https://www.linkedin.com/posts/laurie-bell_well-brightonseo-in-san-diego-was-fun-with-share-7506824067698728960-1Gn_/",
    "quote": "Learnt a lot from highlight speeches by Venkata Pagadala, Andy Crestodina, Cristiano Winckler, Eric Wu, chima mmeje🏳️🌈, Ken 'Magma' Marshall, Benu Aggarwal & Brie Moreau",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506824067698728960.webp",
      "width": 720,
      "height": 907
    }
  },
  {
    "id": "7506940282844762112",
    "author": "Gururaj Pandurangi",
    "authorType": "person",
    "headline": "",
    "posted": "2026-09-18T22:00",
    "phase": "after",
    "reactions": 10,
    "comments": 2,
    "public": true,
    "url": "https://www.linkedin.com/posts/gururajp_brightonseoday1track1searchintentgeopdf-ugcPost-7506940282844762112-oI7U/",
    "quote": "Venkata Pagadala went deep on industrial-level intent classification.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506940282844762112.webp",
      "width": 720,
      "height": 1533
    }
  },
  {
    "id": "7507691320958672898",
    "author": "Metehan Yeşilyurt",
    "authorType": "person",
    "headline": "GEO Researcher @ Peec AI",
    "posted": "2026-09-20T23:44",
    "phase": "after",
    "reactions": 219,
    "comments": 22,
    "public": true,
    "url": "https://www.linkedin.com/posts/metehanyesilyurt_ankara-to-san-diego-is-a-long-way-a-very-ugcPost-7507691320958672898-xPJN/",
    "quote": "Amazing people, amazing energy, and a great few days in California. Venkata Pagadala Raymond Martinez Noah Learner … and I'm sorry for the Linkedin limits because I actually have a longer list!",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7507691320958672898.webp",
      "width": 720,
      "height": 1697
    }
  },
  {
    "id": "7508173183313854465",
    "author": "The FCDC",
    "authorType": "page",
    "headline": "",
    "posted": "2026-09-22T07:39",
    "phase": "next",
    "reactions": 19,
    "comments": 3,
    "public": true,
    "url": "https://www.linkedin.com/posts/audience-research-is-one-of-the-most-important-share-7508173183313854465-3Sk4/",
    "quote": "And that’s what Venkata Pagadala, Lead Technical Product Manager at AT&T, is going to show us in our next Expert Series session.",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7508173183313854465.webp",
      "width": 720,
      "height": 1355
    }
  }
];

export const MY_TALK_POSTS: MyTalkPost[] = [
  {
    "label": "Announcement",
    "posted": "2026-08-29T20:00",
    "reactions": 141,
    "comments": 50,
    "url": "https://www.linkedin.com/posts/venkata-pagadala_brightonseo-brightonseo2026-ugcPost-7499662299528507392-76hy/",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7499662299528507392.webp",
      "width": 720,
      "height": 1032
    }
  },
  {
    "label": "Teaser: search volume is a direction, not a strategy",
    "posted": "2026-09-09T20:41",
    "reactions": 73,
    "comments": 10,
    "url": "https://www.linkedin.com/feed/update/urn:li:activity:7503658894251143168/",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7503658894251143168.webp",
      "width": 720,
      "height": 1087
    }
  },
  {
    "label": "Talk day: thank you, mom",
    "posted": "2026-09-15T15:06",
    "reactions": 211,
    "comments": 78,
    "url": "https://www.linkedin.com/feed/update/urn:li:activity:7505748802889293824/",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7505748802889293824.webp",
      "width": 720,
      "height": 895
    }
  },
  {
    "label": "Recap: user first, algorithm second",
    "posted": "2026-09-17T08:16",
    "reactions": 89,
    "comments": 23,
    "url": "https://www.linkedin.com/feed/update/urn:li:ugcPost:7506370624076959745/",
    "image": {
      "src": "/talks/brightonseo-san-diego-2026/posts/7506370624076959745.webp",
      "width": 720,
      "height": 1059
    }
  }
];

export const NEXT_TALK_POST: MyTalkPost | null = {
  "label": "Next talk: The FCDC Expert Series",
  "posted": "2026-09-22T11:29",
  "reactions": 82,
  "comments": 11,
  "url": "https://www.linkedin.com/feed/update/urn:li:activity:7508230968919343105/",
  "image": {
    "src": "/talks/brightonseo-san-diego-2026/posts/7508230968919343105.webp",
    "width": 720,
    "height": 1085
  }
};

/** Everyone who posted about the talk or helped shape it: one alphabetical list, nobody set apart, each name to its LinkedIn. */
export const THANK_YOU: ThankYou[] = [
  {
    "name": "Alison Delamota",
    "url": "https://www.linkedin.com/in/alisondelamota/"
  },
  {
    "name": "Amal Alexander",
    "url": "https://www.linkedin.com/in/amal-alexander-305780131/"
  },
  {
    "name": "Amir Yazdi",
    "url": "https://www.linkedin.com/in/amiryazdi/"
  },
  {
    "name": "Amit Patel",
    "url": "https://www.linkedin.com/in/amit-patel-7bba9b7b/"
  },
  {
    "name": "Andrew Ansley",
    "url": "https://www.linkedin.com/in/andrew-ansley-marketing/"
  },
  {
    "name": "Angela Skane",
    "url": "https://www.linkedin.com/in/angelaskane/"
  },
  {
    "name": "Anjul Singhvi",
    "url": "https://www.linkedin.com/in/anjul-singhvi-seo-digital-marketing/"
  },
  {
    "name": "Anu Jagga Narang",
    "url": "https://www.linkedin.com/in/ajnarang/"
  },
  {
    "name": "Balvinder Singh",
    "url": "https://www.linkedin.com/in/balvinder-singh-10bb4a225/"
  },
  {
    "name": "Bryan Grossbauch",
    "url": "https://www.linkedin.com/in/bryan-grossbauch/"
  },
  {
    "name": "Callie Collins",
    "url": "https://www.linkedin.com/in/callie-collins-2bb46821b/"
  },
  {
    "name": "Carmen Aragones",
    "url": "https://www.linkedin.com/in/carmen-jim%C3%A9nez-aragon%C3%A9s/"
  },
  {
    "name": "Chris Sullivan",
    "url": "https://www.linkedin.com/in/chris1sullivan/"
  },
  {
    "name": "Damian Yupari",
    "url": "https://www.linkedin.com/in/damian-yupari/"
  },
  {
    "name": "David Bell",
    "url": "https://www.linkedin.com/in/dbellgo/"
  },
  {
    "name": "Derek Hyman, MPH",
    "url": "https://www.linkedin.com/in/derekhymanmph/"
  },
  {
    "name": "Divyamanasa Pasumarthy",
    "url": "https://www.linkedin.com/in/divyamanasapasumarthy/"
  },
  {
    "name": "Dre de Vera",
    "url": "https://www.linkedin.com/in/dredevera/"
  },
  {
    "name": "Duncan Sze",
    "url": "https://www.linkedin.com/in/duncansze/"
  },
  {
    "name": "Ejiro Esiri",
    "url": "https://www.linkedin.com/in/ejiroesiri/"
  },
  {
    "name": "Elle Santos",
    "url": "https://www.linkedin.com/in/ellesantos/"
  },
  {
    "name": "Gaurav Patil",
    "url": "https://www.linkedin.com/in/gaurav-patil-seo/"
  },
  {
    "name": "George Nguyen",
    "url": "https://www.linkedin.com/in/george-c-nguyen/"
  },
  {
    "name": "Gireesh Subramanya",
    "url": "https://www.linkedin.com/in/gireesh-subramanya/"
  },
  {
    "name": "Gururaj Pandurangi",
    "url": "https://www.linkedin.com/in/gururajp/"
  },
  {
    "name": "Harinath Babu",
    "url": "https://www.linkedin.com/in/harinathbabu/"
  },
  {
    "name": "Jason W.",
    "url": "https://www.linkedin.com/in/jwilson415/"
  },
  {
    "name": "Jean-Christophe Chouinard",
    "url": "https://www.linkedin.com/in/jeanchristophechouinard/"
  },
  {
    "name": "Jean-Guy Leconte",
    "url": "https://www.linkedin.com/in/jean-guy-leconte-7342941/"
  },
  {
    "name": "Jennifer Haley",
    "url": "https://www.linkedin.com/in/jennifer-nicole-haley/"
  },
  {
    "name": "Joe Edakkunnathu",
    "url": "https://www.linkedin.com/in/joeedakkunnathu/"
  },
  {
    "name": "Jon Buschlen",
    "url": "https://www.linkedin.com/in/jonbuschlen/"
  },
  {
    "name": "Jordan Choo",
    "url": "https://www.linkedin.com/in/jordanchoo/"
  },
  {
    "name": "Jordan Koene",
    "url": "https://www.linkedin.com/in/jordankoene/"
  },
  {
    "name": "Joseph Gibbie",
    "url": "https://www.linkedin.com/in/joseph-gibbie/"
  },
  {
    "name": "Karen Krause",
    "url": "https://www.linkedin.com/in/karen-krause-2691698b/"
  },
  {
    "name": "Karimjon Umarov",
    "url": "https://www.linkedin.com/in/karimjon-umarov-b2417a59/"
  },
  {
    "name": "Kelly LaVoie, MS, RD, LDN",
    "url": "https://www.linkedin.com/in/kelly-lavoie-rd/"
  },
  {
    "name": "Kelvin Newman",
    "url": "https://www.linkedin.com/in/kelvinnewman/"
  },
  {
    "name": "Krinal Mehta",
    "url": "https://www.linkedin.com/in/krinal/"
  },
  {
    "name": "Kunjal Chawhan",
    "url": "https://www.linkedin.com/in/kunjal-chawhan/"
  },
  {
    "name": "Laurie Bell",
    "url": "https://www.linkedin.com/in/laurie-bell/"
  },
  {
    "name": "Link Building HQ",
    "url": "https://www.linkedin.com/company/linkbuildinghq/"
  },
  {
    "name": "Logan Young",
    "url": "https://www.linkedin.com/in/logan-young-812ab6209/"
  },
  {
    "name": "Maddula Tejaswi",
    "url": "https://www.linkedin.com/in/maddula-tejas/"
  },
  {
    "name": "Madhavi Maddula",
    "url": "https://www.linkedin.com/in/madhavi-maddula/"
  },
  {
    "name": "Metehan Yeşilyurt",
    "url": "https://www.linkedin.com/in/metehanyesilyurt/"
  },
  {
    "name": "Mihir Naik",
    "url": "https://www.linkedin.com/in/mihir23192/"
  },
  {
    "name": "Neil Burtt",
    "url": "https://www.linkedin.com/in/neilburtt/"
  },
  {
    "name": "Nitin Manchanda",
    "url": "https://www.linkedin.com/in/nitman/"
  },
  {
    "name": "Noah Learner",
    "url": "https://www.linkedin.com/in/noahlearner/"
  },
  {
    "name": "Parth Suba",
    "url": "https://www.linkedin.com/in/parthsuba77/"
  },
  {
    "name": "Pedro Angel",
    "url": "https://www.linkedin.com/in/pedro-angel-2618061aa/"
  },
  {
    "name": "Philip Mastroianni",
    "url": "https://www.linkedin.com/in/philipmastroianni/"
  },
  {
    "name": "Raga Kotha",
    "url": "https://www.linkedin.com/in/raga-kotha9/"
  },
  {
    "name": "Ray Grieselhuber",
    "url": "https://www.linkedin.com/in/raygrieselhuber/"
  },
  {
    "name": "Raymond Martinez",
    "url": "https://www.linkedin.com/in/raymond-martinez-seo/"
  },
  {
    "name": "Russ Macumber",
    "url": "https://www.linkedin.com/in/russmacumber/"
  },
  {
    "name": "Ruthvik Pagadala",
    "url": "https://www.linkedin.com/in/ruthvik-pagadala-a96b9441a/"
  },
  {
    "name": "Sabitha Venugopal",
    "url": "https://www.linkedin.com/in/sabitha-venugopal-mba-586aa78/"
  },
  {
    "name": "Sagar Kumar",
    "url": "https://www.linkedin.com/in/hackit-sagar/"
  },
  {
    "name": "Samantha Torres",
    "url": "https://www.linkedin.com/in/samantha-torres-seo/"
  },
  {
    "name": "Sanjay Singh",
    "url": "https://www.linkedin.com/in/sanjaysingh7727/"
  },
  {
    "name": "Satish Mohan",
    "url": "https://www.linkedin.com/in/satish-mohan-0b99232/"
  },
  {
    "name": "Smith Shah",
    "url": "https://www.linkedin.com/in/smith-shah3107/"
  },
  {
    "name": "Sowmya Varanasi",
    "url": "https://www.linkedin.com/in/sowmya-varanasi-52282a6b/"
  },
  {
    "name": "Takeru Muroya",
    "url": "https://www.linkedin.com/in/%F0%9F%87%AF%F0%9F%87%B5takeru-muroya-32143080/"
  },
  {
    "name": "Taylor Galla",
    "url": "https://www.linkedin.com/in/taylorgalla/"
  },
  {
    "name": "Tyson Stockton",
    "url": "https://www.linkedin.com/in/tysonstockton/"
  },
  {
    "name": "Venkata Siva Kumar Kondeti",
    "url": "https://www.linkedin.com/in/venkata-siva-kumar-kondeti-27bb4622/"
  },
  {
    "name": "Victor Pan",
    "url": "https://www.linkedin.com/in/victorpan/"
  },
  {
    "name": "Vipul Mahrishi",
    "url": "https://www.linkedin.com/in/vipul-mahrishi/"
  },
  {
    "name": "Wil Reynolds",
    "url": "https://www.linkedin.com/in/wilreynolds/"
  },
  {
    "name": "Yeswanth Kumar Pagadala",
    "url": "https://www.linkedin.com/in/yeswanth-kumar-pagadala-931786a5/"
  },
  {
    "name": "Zach Chahalis",
    "url": "https://www.linkedin.com/in/zacharychahalis/"
  },
  {
    "name": "Zach Doty",
    "url": "https://www.linkedin.com/in/zldoty/"
  },
  {
    "name": "Zak Perez",
    "url": "https://www.linkedin.com/in/zakperez/"
  }
];

/** Totals over the talk posts: the posts by others plus Venkata's own. Public sources only. */
export const SUPPORT_TOTALS = {
  "captured": "2026-09-25",
  "posts": 23,
  "authors": 22,
  "before": 12,
  "day": 4,
  "after": 7,
  "talkPosts": 27,
  "reactions": 1638,
  "comments": 291,
  "myPosts": 4,
  "myReactions": 514,
  "myComments": 161,
  "theirReactions": 1124,
  "theirComments": 130,
  "commenters": 0,
  "helpers": 55,
  "people": 77
};
