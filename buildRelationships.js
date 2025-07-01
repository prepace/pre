// script.js
const fs = require("fs").promises;
const nlp = require("compromise");
const { Graph } = require("graphlib");

// 1. Simple header parser
function parseHeaders(raw) {
  const headers = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) break;   // stop at first blank line
    if (line.startsWith("From:"))    headers.from    = line.replace(/^From:\s*/, "").trim();
    else if (line.startsWith("To:")) headers.to      = line.replace(/^To:\s*/, "").trim();
    else if (line.startsWith("Date:"))headers.date    = line.replace(/^Date:\s*/, "").trim();
    else if (line.startsWith("Subject:")) headers.subject = line.replace(/^Subject:\s*/, "").trim();
  }
  return headers;
}

// 2. Regex‐based relation patterns
const RELATION_PATTERNS = [
  { re: /([A-Z][a-z]+)\s+died\s+in\s+(\d{4})/g,    subj:1, obj:2, rel:"died_in" },
  { re: /([A-Z][a-z]+)\s+left\s+us\s+in\s+(\d{4})/g,subj:1, obj:2, rel:"left_in" },
  { re: /([A-Z][a-z]+)\s+will\s+leave.*?home\s+in\s+([A-Z][a-z]+)/g,
    subj:1, obj:2, rel:"will_move_to" },
  // …add your own patterns
];

// 3. Ingest headers into graph
function ingestHeaders(G, headers) {
  const letterId = `letter:${headers.date||Date.now()}`;
  G.setNode(letterId, { type:"Letter", ...headers });

  if (headers.from) {
    const sender = headers.from.replace(/<.*?>/,"").trim();
    G.setNode(sender, { type:"Person" });
    G.setEdge(sender, letterId, "wrote");
  }
  // you could also ingest “to” recipients, subject, etc.
  return letterId;
}

// 4. Apply regex relations
function applyRegexRelations(G, body) {
  RELATION_PATTERNS.forEach(pat => {
    let m;
    while ((m = pat.re.exec(body)) !== null) {
      const subj = m[pat.subj], obj = m[pat.obj];
      const subjType = /^[A-Z][a-z]+$/.test(subj) ? "Person" : "Unknown";
      const objType = pat.rel.endsWith("_in")
        ? (/^\d/.test(obj) ? "Date" : "Location")
        : "Unknown";

      G.setNode(subj, { type: subjType });
      G.setNode(obj,  { type: objType });
      G.setEdge(subj, obj, pat.rel);
    }
  });
}

// 5. Use compromise to extract named entities
function applyNlpRelations(G, body) {
  const doc = nlp(body);

  // People
  doc.people().out("array").forEach(name => {
    G.setNode(name, { type:"Person" });
  });
  // Places
  doc.places().out("array").forEach(place => {
    G.setNode(place, { type:"Location" });
  });
  // Dates
  doc.dates().out("array").forEach(date => {
    G.setNode(date, { type:"Date" });
  });

  // Example: closing signature detection
  // look for “Love, <X>” or “Love <X>”
  const loveRe = /Love[,\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  let m;
  while ((m = loveRe.exec(body))) {
    const signer = m[1];
    G.setNode(signer, { type:"Person", role:"signer" });
    // we’ll link letter→signer when we know letterId
    if (G._letterId) {
      G.setEdge(G._letterId, signer, "signed_by");
    }
  }

  // (You can add more custom patterns here, or integrate a coref library)
}

// 6. Main
async function main() {
  const raw = await fs.readFile("/home/william/Pre/public/data/Lovies/2025-text-only/2025-01-07-2025-Lovies Letter_ Tuesday, January 7, 2025_original.txt", "utf8");
  const headers = parseHeaders(raw);
  const body   = raw.split(/\r?\n\r?\n/).slice(1).join("\n\n");

  const G = new Graph({ directed: true });
  const letterId = ingestHeaders(G, headers);
  G._letterId = letterId;      // for use in NLP rules

  applyRegexRelations(G, body);
  applyNlpRelations(G, body);

  // 7. Inspect graph
  console.log("Nodes:");
  G.nodes().forEach(n => console.log(n, G.node(n)));
  console.log("\nEdges:");
  G.edges().forEach(e => {
    console.log(`${e.v} -[${G.edge(e)}]-> ${e.w}`);
  });

  // 8. You could now serialize G to JSON, or push into Neo4j/Supabase…
}

main().catch(console.error);
