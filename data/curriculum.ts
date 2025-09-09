// data/curriculum.ts

// ---------- Types ----------
export type Level =
  | "y1" | "y2" | "y3" | "y4" | "y5" | "y6"
  | "y7" | "y8" | "y9" | "y10" | "y11"; // secondary kept for future

export type SubjectSlug =
  | "maths"
  | "english"
  | "science"
  | "history"
  | "geography"
  | "languages";

export type Skill = {
  id: string;              // "y6.maths.fractions"
  slug: string;            // "fractions"
  title: string;           // "Fractions"
  level: Level;            // e.g. "y6"
  subject: SubjectSlug;    // e.g. "maths"
  pdf?: string;            // "/pdfs/y6/maths/fractions.pdf"
  objectives?: string[];
  resources?: { label: string; url: string }[];
};

// ---------- Helpers ----------
const pdf = (level: Level, subject: SubjectSlug, slug: string) =>
  `/pdfs/${level}/${subject}/${slug}.pdf`;

function mk(
  level: Level,
  subject: SubjectSlug,
  slug: string,
  title: string,
  extras: Partial<Skill> = {}
): Skill {
  return {
    id: `${level}.${subject}.${slug}`,
    slug,
    title,
    level,
    subject,
    pdf: pdf(level, subject, slug),
    ...extras,
  };
}

// ---------- Curriculum (Primary focus Y1–Y6) ----------
export const CURRICULUM: Partial<Record<Level, Record<SubjectSlug, Skill[]>>> = {
  // ===== Y1 =====
  y1: {
    maths: [
      mk("y1","maths","number-to-100","Numbers to 100"),
      mk("y1","maths","add-sub-20","Addition & Subtraction to 20"),
      mk("y1","maths","place-value","Place Value (tens & ones)"),
      mk("y1","maths","shape-2d-3d","2D & 3D Shapes"),
      mk("y1","maths","measures-length-mass","Length & Mass"),
      mk("y1","maths","time-o-clock","Time (o’clock & half past)"),
      mk("y1","maths","money-coins","Money (coins)"),
      mk("y1","maths","fractions-basic","Fractions (halves & quarters)"),
    ],
    english: [
      mk("y1","english","phonics-phase5","Phonics (Phase 5)"),
      mk("y1","english","handwriting","Handwriting & Letter Formation"),
      mk("y1","english","simple-sentences","Simple Sentences & Capital Letters"),
      mk("y1","english","full-stops","Full Stops & Finger Spaces"),
      mk("y1","english","common-exception-words","Common Exception Words"),
      mk("y1","english","narrative-simple","Simple Narratives"),
      mk("y1","english","speaking-listening","Speaking & Listening"),
    ],
    science: [
      mk("y1","science","seasonal-changes","Seasonal Changes"),
      mk("y1","science","animals-incl-humans","Animals including Humans"),
      mk("y1","science","plants","Plants"),
      mk("y1","science","everyday-materials","Everyday Materials"),
    ],
    history: [
      mk("y1","history","changes-living-memory","Changes within Living Memory"),
      mk("y1","history","local-history","Local History"),
      mk("y1","history","significant-individuals","Significant Individuals (intro)"),
    ],
    geography: [
      mk("y1","geography","uk-countries-capitals","UK Countries & Capitals"),
      mk("y1","geography","local-area","My Local Area"),
      mk("y1","geography","weather-daily","Weather & Seasons"),
      mk("y1","geography","simple-maps","Simple Maps & Symbols"),
    ],
    languages: [], // typically starts at KS2
  },

  // ===== Y2 =====
  y2: {
    maths: [
      mk("y2","maths","number-to-100","Numbers to 100"),
      mk("y2","maths","add-sub-100","Add & Subtract to 100 (regrouping)"),
      mk("y2","maths","mult-2-5-10","Multiply & Divide (2, 5, 10)"),
      mk("y2","maths","fractions-halves-quarters","Fractions: 1/2, 1/3, 1/4"),
      mk("y2","maths","money","Money (notes & coins)"),
      mk("y2","maths","time-5-mins","Time (to 5 minutes)"),
      mk("y2","maths","shape-properties","Shape Properties"),
      mk("y2","maths","measure-mass-volume","Mass, Capacity & Temperature"),
    ],
    english: [
      mk("y2","english","reading-comprehension","Reading Comprehension (Y2)"),
      mk("y2","english","spelling-rules","Spelling Rules & Suffixes"),
      mk("y2","english","nouns-verbs-adjectives","Nouns, Verbs & Adjectives"),
      mk("y2","english","punctuation-qs-exclam","Question & Exclamation Marks"),
      mk("y2","english","expanded-noun-phrases","Expanded Noun Phrases"),
      mk("y2","english","writing-recounts","Recounts & Instructions"),
    ],
    science: [
      mk("y2","science","living-things-habitats","Living Things & Habitats"),
      mk("y2","science","plants-growth","Plants – Growth & Needs"),
      mk("y2","science","materials-uses","Materials & Their Uses"),
      mk("y2","science","animals-basic-needs","Animals & Basic Needs"),
    ],
    history: [
      mk("y2","history","events-beyond-memory","Events Beyond Living Memory"),
      mk("y2","history","significant-people","Significant People (e.g., Florence Nightingale)"),
      mk("y2","history","local-heritage","Local Heritage"),
    ],
    geography: [
      mk("y2","geography","continents-oceans","Continents & Oceans"),
      mk("y2","geography","hot-cold-places","Hot & Cold Places"),
      mk("y2","geography","uk-physical-human","UK Human & Physical Features"),
      mk("y2","geography","maps-directions","Maps & Simple Directions"),
    ],
    languages: [],
  },

  // ===== Y3 =====
  y3: {
    maths: [
      mk("y3","maths","place-value-1000","Place Value to 1000"),
      mk("y3","maths","add-sub-3digit","Add & Subtract 3-digit Numbers"),
      mk("y3","maths","mult-div-3-4-8","Multiply & Divide (3, 4, 8)"),
      mk("y3","maths","fractions-tenths","Fractions & Tenths"),
      mk("y3","maths","time-24hr","Time (24-hour)"),
      mk("y3","maths","perimeter","Perimeter"),
      mk("y3","maths","statistics-bar-charts","Statistics (Bar Charts)"),
    ],
    english: [
      mk("y3","english","paragraphs","Paragraphs & Topic Sentences"),
      mk("y3","english","inverted-commas","Inverted Commas for Speech"),
      mk("y3","english","prefixes-suffixes","Prefixes & Suffixes"),
      mk("y3","english","story-settings","Story Settings & Characters"),
      mk("y3","english","nonfiction-reports","Non-fiction Reports"),
      mk("y3","english","vocabulary-building","Vocabulary & Synonyms"),
    ],
    science: [
      mk("y3","science","rocks-soils","Rocks & Soils"),
      mk("y3","science","forces-magnets","Forces & Magnets"),
      mk("y3","science","light","Light & Shadows"),
      mk("y3","science","animals-nutrition","Animals – Nutrition"),
      mk("y3","science","plants-transport","Plants – Functions & Transport"),
    ],
    history: [
      mk("y3","history","stone-age-iron-age","Stone Age to Iron Age"),
      mk("y3","history","ancient-egypt","Ancient Egypt"),
    ],
    geography: [
      mk("y3","geography","rivers","Rivers"),
      mk("y3","geography","mountains","Mountains"),
      mk("y3","geography","volcanoes-earthquakes","Volcanoes & Earthquakes"),
      mk("y3","geography","europe-study","European Region Study"),
      mk("y3","geography","map-skills-4fig","Map Skills (4-figure grid)"),
    ],
    languages: [
      mk("y3","languages","greetings","Greetings & Introductions"),
      mk("y3","languages","numbers-colours","Numbers & Colours"),
      mk("y3","languages","family","Family & Pets"),
      mk("y3","languages","classroom-language","Classroom Language"),
      mk("y3","languages","days-months","Days & Months"),
      mk("y3","languages","food-drink","Food & Drink"),
    ],
  },

  // ===== Y4 =====
  y4: {
    maths: [
      mk("y4","maths","place-value-10000","Place Value to 10,000"),
      mk("y4","maths","add-sub-4digit","Add & Subtract 4-digit Numbers"),
      mk("y4","maths","mult-div-1digit","Multiply & Divide by 1-digit"),
      mk("y4","maths","fractions-decimals","Fractions & Decimals (tenths/hundredths)"),
      mk("y4","maths","area-perimeter","Area & Perimeter"),
      mk("y4","maths","time-intervals","Time & Intervals"),
      mk("y4","maths","geometry-angles","Geometry & Angles"),
      mk("y4","maths","times-tables-upto12","Times Tables to 12×12"),
    ],
    english: [
      mk("y4","english","fronted-adverbials","Fronted Adverbials & Commas"),
      mk("y4","english","pronouns","Pronouns & Cohesion"),
      mk("y4","english","poetry-sound","Poetry – Sound & Rhythm"),
      mk("y4","english","play-scripts","Play Scripts"),
      mk("y4","english","newspaper-reports","Newspaper Reports"),
      mk("y4","english","figurative-language","Figurative Language (intro)"),
    ],
    science: [
      mk("y4","science","states-of-matter","States of Matter"),
      mk("y4","science","sound","Sound"),
      mk("y4","science","electricity-basics","Electricity (simple circuits)"),
      mk("y4","science","living-things-classify","Living Things – Classification (intro)"),
      mk("y4","science","digestive-system","Animals including Humans – Digestion"),
    ],
    history: [
      mk("y4","history","ancient-greece","Ancient Greece"),
      mk("y4","history","romans-britain","Romans in Britain"),
      mk("y4","history","anglo-saxons-scots","Anglo-Saxons & Scots"),
    ],
    geography: [
      mk("y4","geography","settlements","Settlements & Land Use"),
      mk("y4","geography","climate-zones","Climate Zones & Biomes (intro)"),
      mk("y4","geography","trade-routes","Trade & Economic Activity"),
      mk("y4","geography","map-skills-6fig","Map Skills (6-figure grid)"),
    ],
    languages: [
      mk("y4","languages","describing-people","Describing People & Clothes"),
      mk("y4","languages","weather","Weather & Seasons"),
      mk("y4","languages","time-daily-routine","Time & Daily Routine"),
      mk("y4","languages","places-town","Places in Town & Directions"),
      mk("y4","languages","animals","Animals"),
      mk("y4","languages","grammar-gender-articles","Grammar: Gender & Articles"),
    ],
  },

  // ===== Y5 =====
  y5: {
    maths: [
      mk("y5","maths","place-value-1000000","Place Value to 1,000,000"),
      mk("y5","maths","add-sub-large","Add & Subtract Large Numbers"),
      mk("y5","maths","multiply-4digit","Multiply 4-digit by 1–2 digits"),
      mk("y5","maths","division-short","Short Division"),
      mk("y5","maths","fractions-decimals-percents","Fractions, Decimals & Percentages"),
      mk("y5","maths","area-perimeter-volume","Area, Perimeter & Volume"),
      mk("y5","maths","angles-polygons","Angles & Polygons"),
      mk("y5","maths","statistics-line-graphs","Statistics (Line Graphs)"),
    ],
    english: [
      mk("y5","english","modal-verbs-adverbs","Modal Verbs & Adverbs of Possibility"),
      mk("y5","english","relative-clauses","Relative Clauses"),
      mk("y5","english","cohesive-devices","Cohesive Devices & Paragraphing"),
      mk("y5","english","persuasive-writing","Persuasive Writing"),
      mk("y5","english","discursive-reports","Discursive Reports"),
      mk("y5","english","narrative-viewpoint","Narrative Viewpoint & Dialogue"),
    ],
    science: [
      mk("y5","science","properties-materials","Properties & Changes of Materials"),
      mk("y5","science","earth-space","Earth & Space"),
      mk("y5","science","forces","Forces"),
      mk("y5","science","living-things-life-cycles","Living Things – Life Cycles"),
      mk("y5","science","humans-changes","Animals including Humans – Changes to Old Age"),
    ],
    history: [
      mk("y5","history","anglo-saxons-vikings","Anglo-Saxons & Vikings (depth)"),
      mk("y5","history","tudors","Tudors"),
      mk("y5","history","maya","Maya Civilization (or Islamic Golden Age)"),
    ],
    geography: [
      mk("y5","geography","biomes-vegetation-belts","Biomes & Vegetation Belts"),
      mk("y5","geography","rivers-coasts","Rivers & Coasts (processes)"),
      mk("y5","geography","south-america-study","South America Study"),
      mk("y5","geography","os-maps-6fig","OS Maps & 6-figure Grid References"),
      mk("y5","geography","natural-resources","Natural Resources & Energy"),
    ],
    languages: [
      mk("y5","languages","pastimes-hobbies","Pastimes & Hobbies"),
      mk("y5","languages","food-restaurants","Food, Cafés & Restaurants"),
      mk("y5","languages","house-home","House & Home"),
      mk("y5","languages","future-plans","Future Plans (intro)"),
      mk("y5","languages","grammar-present","Grammar: Present Tense"),
      mk("y5","languages","grammar-adjectives-agreement","Adjective Agreement"),
    ],
  },

  // ===== Y6 =====
  y6: {
    maths: [
      mk("y6","maths","fractions","Fractions", {
        objectives: [
          "Compare and order fractions",
          "Add and subtract fractions with common denominators",
        ],
        resources: [{ label: "BBC Bitesize – Fractions", url: "https://www.bbc.co.uk/bitesize/topics/..." }],
      }),
      mk("y6","maths","decimals","Decimals"),
      mk("y6","maths","percentages","Percentages"),
      mk("y6","maths","geometry","Geometry"),
      mk("y6","maths","long-division","Long Division"),
      mk("y6","maths","probability","Probability"),
      mk("y6","maths","algebra","Algebra"),
    ],
    english: [
      mk("y6","english","formal-informal","Formal & Informal Register"),
      mk("y6","english","passive-voice","Passive Voice"),
      mk("y6","english","advanced-punctuation","Colons, Semicolons & Dashes"),
      mk("y6","english","figurative-language-advanced","Figurative Language (advanced)"),
      mk("y6","english","balanced-arguments","Balanced Arguments & Discussions"),
      mk("y6","english","narrative-structure","Narrative Structure & Flashback"),
    ],
    science: [
      mk("y6","science","evolution-inheritance","Evolution & Inheritance"),
      mk("y6","science","light","Light (reflection/refraction)"),
      mk("y6","science","electricity-advanced","Electricity (circuits & components)"),
      mk("y6","science","classification","Classification of Living Things"),
      mk("y6","science","circulatory-system","Human Circulatory System"),
    ],
    history: [
      mk("y6","history","world-war-2","World War II"),
      mk("y6","history","ancient-benin","Ancient Benin"),
      mk("y6","history","civil-rights-20c","20th Century Civil Rights (overview)"),
    ],
    geography: [
      mk("y6","geography","globalisation","Globalisation & Trade"),
      mk("y6","geography","climate-change","Climate Change & Sustainability"),
      mk("y6","geography","urbanisation","Urbanisation & Settlements"),
      mk("y6","geography","fieldwork-project","Fieldwork Project (local study)"),
    ],
    languages: [
      mk("y6","languages","travel-directions","Travel & Directions"),
      mk("y6","languages","holidays-past","Holidays (past & future)"),
      mk("y6","languages","school-subjects","School Subjects & Opinions"),
      mk("y6","languages","grammar-past-future","Grammar: Past & Future (intro)"),
      mk("y6","languages","cultural-topics","Cultural Topics & Festivals"),
    ],
  },
};

// ---------- Utility accessors ----------
export function getSkills(level: Level, subject: SubjectSlug) {
  return CURRICULUM[level]?.[subject] ?? [];
}

export function getSkill(level: Level, subject: SubjectSlug, skillSlug: string) {
  return getSkills(level, subject).find((s) => s.slug === skillSlug);
}

export function allSubjectSlugs(level: Level): SubjectSlug[] {
  return Object.keys(CURRICULUM[level] ?? {}) as SubjectSlug[];
}

export function allSkillParams(level: Level) {
  const params: Array<{ subject: SubjectSlug; skill: string }> = [];
  for (const subject of allSubjectSlugs(level)) {
    for (const s of getSkills(level, subject)) params.push({ subject, skill: s.slug });
  }
  return params;
}
