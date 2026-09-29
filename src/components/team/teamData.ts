// Leadership team content.
// Photos: drop the image into /public/team/ and set `photo`, e.g. photo: "/team/neha.jpg".
// Any colour photo works — it is rendered in black & white inside the glass portrait bubble.
export type Leader = {
  name: string;
  role: string;
  bio: string;
  photo?: string;
};

export const TEAM: Leader[] = [
  {
    name: "Neha Girish",
    role: "CEO",
    bio: "B.Tech from IIT Delhi, specializing in AI & Robotics and next-generation Agentic AI automation systems.",
    // photo: "/team/neha.jpg",
  },
  {
    name: "Prasad Nair",
    role: "CTO",
    bio: "Ex-Microsoft technologist leading AI engineering and delivering scalable solutions.",
    // photo: "/team/prasad.jpg",
  },
];
