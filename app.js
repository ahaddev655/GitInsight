// import { useState } from "react";

// export default function App() {
//   const [username, setUsername] = useState("");
//   const [userData, setUserData] = useState(null);
//   const [repos, setRepos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const fetchGitHubData = async () => {
//     if (!username.trim()) return;

//     setLoading(true);
//     setError("");
//     setUserData(null);
//     setRepos([]);

//     try {
//       const userRes = await fetch(`https://api.github.com/users/${username}`);
//       if (!userRes.ok) throw new Error("User not found");

//       const user = await userRes.json();

//       const repoRes = await fetch(user.repos_url);
//       const repoData = await repoRes.json();

//       setUserData(user);
//       setRepos(repoData);
//     } catch (err) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col items-center p-6">

//       <h1 className="text-3xl font-bold mb-6 text-cyan-400">
//         GitHub Profile Analyzer
//       </h1>

//       {/* Input Section */}
//       <div className="flex gap-2 w-full max-w-md">
//         <input
//           type="text"
//           placeholder="Enter GitHub username..."
//           className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-cyan-400"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//         />

//         <button
//           onClick={fetchGitHubData}
//           className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold"
//         >
//           Search
//         </button>
//       </div>

//       {/* Loading */}
//       {loading && (
//         <p className="mt-6 text-gray-400 animate-pulse">Loading profile...</p>
//       )}

//       {/* Error */}
//       {error && (
//         <p className="mt-6 text-red-400 font-semibold">{error}</p>
//       )}

//       {/* Profile Card */}
//       {userData && (
//         <div className="mt-8 w-full max-w-3xl bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800">
//           <div className="flex items-center gap-4">
//             <img
//               src={userData.avatar_url}
//               alt="avatar"
//               className="w-20 h-20 rounded-full border border-cyan-400"
//             />
//             <div>
//               <h2 className="text-xl font-bold">{userData.name || userData.login}</h2>
//               <p className="text-gray-400">@{userData.login}</p>
//               <p className="text-sm text-gray-500">{userData.bio}</p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-3 gap-4 mt-6 text-center">
//             <div className="bg-gray-800 p-3 rounded-lg">
//               <p className="text-cyan-400 font-bold">{userData.public_repos}</p>
//               <p className="text-sm text-gray-400">Repos</p>
//             </div>
//             <div className="bg-gray-800 p-3 rounded-lg">
//               <p className="text-cyan-400 font-bold">{userData.followers}</p>
//               <p className="text-sm text-gray-400">Followers</p>
//             </div>
//             <div className="bg-gray-800 p-3 rounded-lg">
//               <p className="text-cyan-400 font-bold">{userData.following}</p>
//               <p className="text-sm text-gray-400">Following</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Repo List */}
//       {repos.length > 0 && (
//         <div className="mt-8 w-full max-w-3xl">
//           <h2 className="text-xl font-semibold mb-4 text-cyan-300">
//             Latest Repositories
//           </h2>

//           <div className="grid gap-3">
//             {repos.slice(0, 10).map((repo) => (
//               <a
//                 key={repo.id}
//                 href={repo.html_url}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-cyan-400 transition"
//               >
//                 <div className="flex justify-between">
//                   <p className="font-semibold">{repo.name}</p>
//                   <span className="text-xs text-gray-400">
//                     ⭐ {repo.stargazers_count}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-500">
//                   {repo.description || "No description"}
//                 </p>
//               </a>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

const { useState, useEffect, useRef } = React;
const h = React.createElement;

/* ─── COLORS ─── */
const LANG_COLORS = [
  "#58A6FF",
  "#3FB950",
  "#F7B955",
  "#BC8CFF",
  "#F85149",
  "#39D3BB",
  "#FF8C61",
  "#E3B341",
  "#6EC6F5",
  "#D2A8FF",
];

/* ─── API ─── */
// We use the allorigins CORS proxy which wraps the GitHub API response
async function ghFetch(path) {
  // Try direct first (works in some environments), fallback to proxy
  const direct = `https://api.github.com${path}`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(direct)}`;
  try {
    const r = await fetch(direct, {
      headers: { Accept: "application/vnd.github.v3+json" },
      mode: "cors",
    });
    if (r.ok) return r.json();
    if (r.status === 404) throw new Error("User not found on GitHub.");
    if (r.status === 403)
      throw new Error("GitHub rate limit hit. Try again in a minute.");
    throw new Error(`GitHub API error (${r.status}).`);
  } catch (err) {
    if (
      err.message.includes("not found") ||
      err.message.includes("rate limit") ||
      err.message.includes("API error")
    )
      throw err;
    // Network / CORS blocked — use proxy
    const pr = await fetch(proxy);
    if (!pr.ok)
      throw new Error("Could not reach GitHub API. Check your connection.");
    const wrapper = await pr.json();
    if (!wrapper.contents) throw new Error("Proxy returned empty response.");
    const parsed = JSON.parse(wrapper.contents);
    if (parsed.message === "Not Found")
      throw new Error("User not found on GitHub.");
    if (parsed.message && parsed.message.includes("rate limit"))
      throw new Error("GitHub rate limit hit. Try again in a minute.");
    return parsed;
  }
}

async function fetchUser(username) {
  const clean = username.trim().replace(/^@/, "");
  const [user, repos] = await Promise.all([
    ghFetch(`/users/${clean}`),
    ghFetch(`/users/${clean}/repos?per_page=100&sort=stars`),
  ]);
  if (!Array.isArray(repos)) return { user, repos: [] };
  return { user, repos };
}

/* ─── CALCULATIONS ─── */
function calcLangs(repos) {
  const map = {};
  repos.forEach((r) => {
    if (r.language) map[r.language] = (map[r.language] || 0) + 1;
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / total) * 100),
    }));
}

function calcScore(user, repos) {
  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);
  return Math.round(
    Math.min(user.public_repos / 50, 1) * 30 +
      Math.min(user.followers / 1000, 1) * 25 +
      Math.min(stars / 500, 1) * 25 +
      Math.min(forks / 200, 1) * 20,
  );
}

function tierLabel(s) {
  if (s >= 85) return ["Elite Developer", "#F7B955"];
  if (s >= 70) return ["Advanced Developer", "#58A6FF"];
  if (s >= 50) return ["Proficient Developer", "#3FB950"];
  if (s >= 30) return ["Growing Developer", "#BC8CFF"];
  return ["Emerging Developer", "#8B949E"];
}

function genInsights(user, repos, langs) {
  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);
  const out = [];
  if (langs[0])
    out.push(
      `Primary language is ${langs[0].name} — found in ${langs[0].pct}% of repositories.`,
    );
  if (langs.length >= 4)
    out.push(`Polyglot developer proficient in ${langs.length} languages.`);
  if (stars > 500)
    out.push(
      `Outstanding community traction with ${stars.toLocaleString()} total stars.`,
    );
  else if (stars > 50)
    out.push(
      `Building recognition with ${stars.toLocaleString()} total stars across projects.`,
    );
  if (user.followers > 1000)
    out.push(
      `Highly influential with ${user.followers.toLocaleString()} GitHub followers.`,
    );
  else if (user.followers > 100)
    out.push(
      `Established presence with ${user.followers.toLocaleString()} followers.`,
    );
  if (forks > 100)
    out.push(
      `Code widely adopted — ${forks.toLocaleString()} forks across repositories.`,
    );
  if (user.public_repos > 30)
    out.push(
      `Prolific contributor with ${user.public_repos} public repositories.`,
    );
  const withDesc = repos.filter((r) => r.description).length;
  if (repos.length > 0 && withDesc / repos.length > 0.6)
    out.push(
      "Well-documented portfolio — most repositories have descriptions.",
    );
  const recentActivity = repos.filter((r) => {
    const d = new Date(r.pushed_at);
    return Date.now() - d < 90 * 24 * 3600 * 1000;
  }).length;
  if (recentActivity > 3)
    out.push(
      `Actively maintained — ${recentActivity} repos updated in the last 90 days.`,
    );
  while (out.length < 4)
    out.push("Consistent open-source activity detected on this profile.");
  return out.slice(0, 6);
}

/* ─── PIE CHART ─── */
function PieChart({ data }) {
  const size = 120,
    r = 48,
    cx = 60,
    cy = 60;
  let cum = 0;
  const slices = data.map((d, i) => {
    const start = (cum / 100) * 2 * Math.PI - Math.PI / 2;
    cum += d.pct;
    const end = (cum / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start),
      y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end),
      y2 = cy + r * Math.sin(end);
    const large = d.pct > 50 ? 1 : 0;
    return h("path", {
      key: i,
      d: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
      fill: LANG_COLORS[i % LANG_COLORS.length],
      stroke: "#0D1117",
      strokeWidth: 2,
    });
  });
  return h(
    "svg",
    { width: size, height: size, style: { flexShrink: 0 } },
    slices,
  );
}

/* ─── SCORE CIRCLE ─── */
function ScoreCircle({ score }) {
  const r = 52,
    cx = 70,
    cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const [tier, color] = tierLabel(score);
  return h(
    "div",
    { className: "score-wrap" },
    h(
      "div",
      { className: "score-circle" },
      h(
        "svg",
        {
          width: 140,
          height: 140,
          style: { transform: "rotate(-90deg)" },
        },
        h("circle", {
          cx,
          cy,
          r,
          fill: "none",
          stroke: "#30363D",
          strokeWidth: 9,
        }),
        h("circle", {
          cx,
          cy,
          r,
          fill: "none",
          stroke: color,
          strokeWidth: 9,
          strokeDasharray: `${dash.toFixed(1)} ${circ.toFixed(1)}`,
          strokeLinecap: "round",
        }),
      ),
      h(
        "div",
        { className: "score-inner" },
        h("span", { className: "score-num", style: { color } }, score),
        h("span", { className: "score-denom" }, "/100"),
      ),
    ),
    h("div", { className: "score-tier", style: { color } }, tier),
    h(
      "div",
      { className: "score-sub-text" },
      "Repos · Stars · Forks · Followers",
    ),
    h(
      "div",
      { className: "score-breakdown" },
      [
        ["Repos", "30%"],
        ["Followers", "25%"],
        ["Stars", "25%"],
        ["Forks", "20%"],
      ].map(([l, p]) =>
        h(
          "div",
          { key: l, className: "score-pill" },
          h("div", { className: "score-pill-label" }, l),
          h("div", { className: "score-pill-val" }, p),
        ),
      ),
    ),
  );
}

/* ─── LANDING ─── */
function Landing({ onSearch }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    if (!q.trim()) {
      setErr("Please enter a GitHub username.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const data = await fetchUser(q);
      onSearch(data);
    } catch (e) {
      setErr(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return h(
    "div",
    { className: "landing" },
    h("div", { className: "grid-bg" }),
    h("div", { className: "blob blob1" }),
    h("div", { className: "blob blob2" }),
    h("div", { className: "blob blob3" }),
    h("div", { className: "logo-mark" }, "⬡ GitInsight"),
    h(
      "h1",
      { className: "hero-title" },
      "Analyze Any GitHub\nProfile in Seconds",
    ),
    h(
      "p",
      { className: "hero-sub" },
      "Stats · Languages · Score · Insights — no login required",
    ),
    h(
      "div",
      { className: "search-glass" },
      h("input", {
        type: "text",
        placeholder: "Enter GitHub username…",
        value: q,
        autoFocus: true,
        onChange: (ev) => {
          setQ(ev.target.value);
          setErr("");
        },
        onKeyDown: (ev) => ev.key === "Enter" && go(),
      }),
      err && h("div", { className: "error-box" }, "⚠ " + err),
      h(
        "button",
        { className: "btn-main", onClick: go, disabled: busy },
        busy ? "Fetching data…" : "→ Analyze Profile",
      ),
    ),
    h(
      "p",
      { className: "hint" },
      "Try: torvalds · gaearon · sindresorhus · dan-abramov",
    ),
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ data, onBack }) {
  const { user, repos } = data;
  const langs = calcLangs(repos);
  const score = calcScore(user, repos);
  const insights = genInsights(user, repos, langs);
  const totalStars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  return h(
    "div",
    { className: "dashboard" },
    h(
      "div",
      { className: "dash-header" },
      h("button", { className: "back-btn", onClick: onBack }, "← Search again"),
      h("span", { className: "dash-logo" }, "⬡ GitInsight"),
    ),

    /* ── Profile + Score ── */
    h(
      "div",
      { className: "profile-row" },
      h(
        "div",
        { className: "card" },
        h(
          "div",
          {
            style: {
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
            },
          },
          h("img", {
            src: user.avatar_url,
            className: "avatar",
            alt: user.login,
          }),
          h(
            "div",
            {},
            h("div", { className: "profile-name" }, user.name || user.login),
            h("div", { className: "profile-login" }, "@" + user.login),
          ),
        ),
        user.bio && h("p", { className: "profile-bio" }, user.bio),
        h(
          "div",
          { className: "meta-row" },
          user.location &&
            h("span", { className: "meta-item" }, "📍 " + user.location),
          user.company &&
            h("span", { className: "meta-item" }, "🏢 " + user.company),
          user.blog &&
            h(
              "span",
              { className: "meta-item" },
              "🔗 " + user.blog.replace(/^https?:\/\//, "").replace(/\/$/, ""),
            ),
        ),
        h(
          "div",
          { className: "follow-row" },
          h(
            "div",
            {},
            h("div", { className: "fnum" }, user.followers.toLocaleString()),
            h("div", { className: "flabel" }, "Followers"),
          ),
          h(
            "div",
            {},
            h("div", { className: "fnum" }, user.following.toLocaleString()),
            h("div", { className: "flabel" }, "Following"),
          ),
        ),
        h(
          "a",
          {
            href: `https://github.com/${user.login}`,
            target: "_blank",
            rel: "noopener",
            className: "gh-link",
          },
          "View on GitHub →",
        ),
      ),

      h(
        "div",
        { className: "card" },
        h("div", { className: "section-title" }, "GitHub Score"),
        h(ScoreCircle, { score }),
      ),
    ),

    /* ── Stats ── */
    h(
      "div",
      { className: "stats-grid" },
      [
        {
          icon: "📦",
          val: user.public_repos,
          label: "Repositories",
          color: "#58A6FF",
        },
        {
          icon: "⭐",
          val: totalStars.toLocaleString(),
          label: "Total Stars",
          color: "#F7B955",
        },
        {
          icon: "🍴",
          val: totalForks.toLocaleString(),
          label: "Total Forks",
          color: "#3FB950",
        },
        {
          icon: "👥",
          val: user.followers.toLocaleString(),
          label: "Followers",
          color: "#BC8CFF",
        },
      ].map((s) =>
        h(
          "div",
          { key: s.label, className: "stat-card" },
          h("div", { className: "stat-icon" }, s.icon),
          h("div", { className: "stat-val", style: { color: s.color } }, s.val),
          h("div", { className: "stat-lbl" }, s.label),
        ),
      ),
    ),

    /* ── Language + Insights ── */
    h(
      "div",
      { className: "two-col" },
      langs.length > 0 &&
        h(
          "div",
          { className: "card" },
          h("div", { className: "section-title" }, "Most Used Languages"),
          h(
            "div",
            { className: "pie-row" },
            h(PieChart, { data: langs }),
            h(
              "div",
              { className: "lang-list" },
              langs.map((l, i) =>
                h(
                  "div",
                  { key: l.name, className: "lang-row" },
                  h("div", {
                    className: "lang-dot",
                    style: {
                      background: LANG_COLORS[i % LANG_COLORS.length],
                    },
                  }),
                  h("span", { className: "lang-name" }, l.name),
                  h("span", { className: "lang-pct" }, l.pct + "%"),
                ),
              ),
            ),
          ),
        ),
      h(
        "div",
        { className: "card" },
        h("div", { className: "section-title" }, "Profile Insights"),
        h(
          "div",
          { className: "insight-list" },
          insights.map((txt, i) =>
            h("div", { key: i, className: "insight-card" }, txt),
          ),
        ),
      ),
    ),

    /* ── Top Repos ── */
    h("div", { className: "section-title" }, "Top Repositories"),
    h(
      "div",
      { className: "repos-grid" },
      topRepos.map((repo) =>
        h(
          "div",
          { key: repo.id, className: "repo-card" },
          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: ".5rem",
              },
            },
            h("div", { className: "repo-name", title: repo.name }, repo.name),
            h(
              "a",
              {
                href: repo.html_url,
                target: "_blank",
                rel: "noopener",
                style: {
                  fontSize: ".72rem",
                  color: "var(--accent)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                },
              },
              "↗ View",
            ),
          ),
          h(
            "div",
            { className: "repo-desc" },
            repo.description
              ? repo.description.length > 72
                ? repo.description.slice(0, 72) + "…"
                : repo.description
              : "No description provided.",
          ),
          h(
            "div",
            { className: "repo-footer" },
            repo.language && h("span", { className: "badge" }, repo.language),
            h(
              "span",
              { className: "rstat" },
              "⭐ " + (repo.stargazers_count || 0),
            ),
            h("span", { className: "rstat" }, "🍴 " + (repo.forks_count || 0)),
            ...(repo.topics || [])
              .slice(0, 1)
              .map((t) =>
                h("span", { key: t, className: "badge badge-green" }, t),
              ),
          ),
        ),
      ),
    ),
  );
}

/* ─── ROOT ─── */
function App() {
  const [view, setView] = useState("landing");
  const [data, setData] = useState(null);

  if (view === "dashboard" && data)
    return h(Dashboard, {
      data,
      onBack: () => {
        setData(null);
        setView("landing");
      },
    });
  return h(Landing, {
    onSearch: (d) => {
      setData(d);
      setView("dashboard");
    },
  });
}

ReactDOM.render(h(App), document.getElementById("app"));
