import { usccbUrl, audioUrl, mainRefs, shortLabel, isReadingsData } from "../src/readings";
// @ts-ignore
import { parseDay, parseRss } from "../scripts/fetch-readings.mjs";
let fail = 0;
const eq = (name: string, got: any, want: any) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };
eq("usccb url 10/27/26", usccbUrl(new Date(2026, 9, 27)), "https://bible.usccb.org/bible/readings/102726.cfm");
eq("usccb url 1/5/27", usccbUrl(new Date(2027, 0, 5)), "https://bible.usccb.org/bible/readings/010527.cfm");
eq("audio url", audioUrl(new Date(2026, 10, 1)), "https://bible.usccb.org/podcasts/audio/daily-mass-reading-podcast-november-1-2026");
eq("short labels", ["Reading 1", "Responsorial Psalm", "Reading 2", "Gospel"].map(shortLabel), ["1st reading", "Psalm", "2nd reading", "Gospel"]);
const day = { title: "T", readings: [{ label: "Reading 1", cite: "Ephesians 5:21-33" }, { label: "Responsorial Psalm", cite: "Psalm 128:1-2" }, { label: "Alleluia", cite: "See Matthew 11:25" }, { label: "Gospel", cite: "Luke 13:18-21" }, { label: "Gospel", cite: "Luke 13:18-19" }] };
eq("main refs drop alleluia + dup options", mainRefs(day).map((r) => r.cite), ["Ephesians 5:21-33", "Psalm 128:1-2", "Luke 13:18-21"]);
eq("data guard", [isReadingsData({ days: {} }), isReadingsData(null), isReadingsData({})], [true, false, false]);
const TEXT = "Brothers and sisters: Be subordinate to one another";
const html = `<div class="wr-block b-lectionary"><div class="innerblock"><h2>Tuesday of the Thirtieth Week in Ordinary Time
  </h2><p>Lectionary: 480</p></div></div>
  <div class="content-header"><h3 class="name">Reading 1 </h3><div class="address">  <a href="https://bible.usccb.org/bible/ephesians/5?21 ">Ephesians 5:21-33 </a> </div></div><div class="content-body"><p>${TEXT}</p></div>
  <div class="content-header"><h3 class="name">Gospel </h3><div class="address"><a href="x">Luke 13:18-21</a></div></div><div class="content-body"><p>Jesus said</p></div>
  <a href="/podcasts/audio/daily-mass-reading-podcast-october-27-2026">a</a><a href="/podcasts/video/2026-10-27-tuesday">v</a>`;
const d = parseDay(html);
eq("parse title", d.title, "Tuesday of the Thirtieth Week in Ordinary Time");
eq("parse cites", d.readings, [{ label: "Reading 1", cite: "Ephesians 5:21-33" }, { label: "Gospel", cite: "Luke 13:18-21" }]);
eq("parse links", [d.audio, d.video], ["https://bible.usccb.org/podcasts/audio/daily-mass-reading-podcast-october-27-2026", "https://bible.usccb.org/podcasts/video/2026-10-27-tuesday"]);
eq("never stores reading text", JSON.stringify(d).includes("subordinate") || JSON.stringify(d).includes("Jesus said"), false);
eq("not a readings page", parseDay("<title>Checking connection</title>"), null);
const rss = `<rss><channel><item>\n<title>Tuesday of the Thirtieth Week in Ordinary Time</title>\n<link>https://bible.usccb.org/bible/readings/102726.cfm</link>\n<description>&lt;h4&gt;Reading 1  &lt;a href="https://bible.usccb.org/bible/ephesians/5?21 "&gt;Ephesians 5:21-33 &lt;/a&gt;&lt;/h4&gt; &lt;p&gt;${TEXT}&lt;/p&gt;&lt;h4&gt;Gospel  &lt;a href="x"&gt;Luke 13:18-21&lt;/a&gt;&lt;/h4&gt;</description></item></channel></rss>`;
const r = parseRss(rss);
eq("rss parse", r, { "2026-10-27": { title: "Tuesday of the Thirtieth Week in Ordinary Time", readings: [{ label: "Reading 1", cite: "Ephesians 5:21-33" }, { label: "Gospel", cite: "Luke 13:18-21" }] } });
eq("rss never stores text", JSON.stringify(r).includes("subordinate"), false);
if (fail) { console.log(`${fail} readings test(s) failed`); process.exit(1); } else console.log("All readings tests passed");
