// Wayne A. Ince — Breaking Ranks Books
const BOOKS = [
  {
    id: "well-runs-dry",
    title: "Until the Well Runs Dry",
    subtitle: "A Veteran's Fight for Mental Health",
    series: "Memoir",
    year: "2023",
    pages: 286,
    genre: "Memoir",
    rating: 4.9,
    reviews: 412,
    blurb: "A retired Senior Master Sergeant breaks his own silence on delayed-onset PTSD — the years he lost to it, the day he decided not to, and the practical ground he walked back from the edge.",
    cover: "assets/cover-well-runs-dry.jpeg",
    buyUrl: "https://a.co/d/04c5xNBh",
    badge: "Latest Release",
    isFeatured: true,
    rank: "01",
    color: { bg: "#0e1a26", fg: "#e8dcc0", accent: "#c9a961" },
  },
  {
    id: "unseen-march",
    title: "The Unseen March",
    subtitle: "Carrying What We Don't Talk About",
    series: "Essays & Reflections",
    year: "2022",
    pages: 244,
    genre: "Non-fiction",
    rating: 4.8,
    reviews: 287,
    blurb: "Twenty-three years in uniform. Four combat zones. One question every veteran is asked at home and almost never answers honestly. Big Sarge writes the answer.",
    buyUrl: "https://a.co/d/00wHbYWS",
    cover: "assets/cover-unseen-march.png",
    badge: null,
    isFeatured: false,
    rank: "02",
    color: { bg: "#2d2418", fg: "#f4e8d0", accent: "#d4a85a" },
    artStyle: "march",
  },
  {
    id: "sweetwater",
    title: "Sweetwater Reckoning",
    subtitle: "A Novel",
    series: "Fiction",
    year: "2024",
    pages: 392,
    genre: "Thriller",
    rating: 4.7,
    reviews: 521,
    blurb: "When a Gulf War medic returns to the Texas town that raised him, the past doesn't ask permission. A debut novel about debts, dust, and the men who never came all the way home.",
    buyUrl: "https://a.co/d/03jVPc51",
    cover: "assets/cover-sweetwater.jpeg",
    badge: "New",
    isFeatured: false,
    rank: "03",
    color: { bg: "#3a1f14", fg: "#f0d8a8", accent: "#e0884a" },
    artStyle: "dust",
  },
];

const REVIEWS = [
  {
    text: "A must-read thriller. Ince writes with the unblinking clarity of a man who has actually carried what he describes — not borrowed it.",
    name: "Margaret H. Walsh",
    source: "Veterans' Review · Verified Reader",
    initial: "M",
    stars: 5,
  },
  {
    text: "Until the Well Runs Dry is the book I wish my father had been given in 1991. Honest, practical, and hard-earned on every page.",
    name: "James Ortega",
    source: "Reader · Amazon",
    initial: "J",
    stars: 5,
  },
  {
    text: "Big Sarge writes like he's sitting across from you at a kitchen table — direct, plainspoken, and utterly without flinch. A vital voice.",
    name: "Diane Pemberton",
    source: "First Responders Today",
    initial: "D",
    stars: 5,
  },
];

const PRESS = [
  { name: "Veterans Today", quote: "Plainspoken and unflinching." },
  { name: "Stars & Stripes", quote: "A field manual for the men who came home wrong." },
  { name: "Military.com", quote: "Required reading for anyone in uniform — or who loves someone who was." },
  { name: "PTSD Journal", quote: "Practical. Honest. Necessary." },
];

const NAV = [
  { label: "Watch", href: "#watch" },
  { label: "Books", href: "#books" },
  { label: "About Wayne", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Newsletter", href: "#newsletter" },
];

const STATS = [
  { num: "23", label: "Years of Service" },
  { num: "4", label: "Combat Deployments" },
  { num: "3", label: "Books Published" },
  { num: "12K+", label: "Readers Reached" },
];

window.BOOKS = BOOKS;
window.REVIEWS = REVIEWS;
window.PRESS = PRESS;
window.NAV = NAV;
window.STATS = STATS;
