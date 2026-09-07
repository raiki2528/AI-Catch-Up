import data from "./data/members.js";

const state = {
  members: [],
  groups: [],
  community: {},
};

const els = {
  communityName: document.getElementById("community-name"),
  communityTagline: document.getElementById("community-tagline"),
  communityDescription: document.getElementById("community-description"),
  memberCount: document.getElementById("member-count"),
  membersSections: document.getElementById("members-sections"),
  emptyState: document.getElementById("empty-state"),
  cardTemplate: document.getElementById("member-card-template"),
};

function normalizeLinkedInUrl(url) {
  try {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes("linkedin.com")) return null;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "") + "/";
  } catch {
    return null;
  }
}

function slugFromLinkedIn(url) {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : "member";
}

function displayNameFromSlug(slug) {
  return slug
    .replace(/-\d+$/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function linkedInAvatarUrl(slug) {
  return `https://unavatar.io/linkedin/${encodeURIComponent(slug)}`;
}

function enrichMember(raw, index) {
  const linkedin = normalizeLinkedInUrl(raw.linkedin || "");
  const slug = linkedin ? slugFromLinkedIn(linkedin) : `member-${index + 1}`;
  const fallbackName = displayNameFromSlug(slug);

  return {
    id: raw.id || slug,
    linkedin,
    slug,
    group: raw.group || "member",
    name: (raw.name || "").trim() || fallbackName,
    title: (raw.title || "").trim(),
    company: (raw.company || "").trim(),
    note: (raw.note || "").trim(),
    avatar: (raw.avatar || "").trim() || (linkedin ? linkedInAvatarUrl(slug) : ""),
  };
}

function buildCard(member) {
  const node = els.cardTemplate.content.cloneNode(true);
  const initialsEl = node.querySelector(".avatar__initials");
  const imgEl = node.querySelector(".avatar__img");
  const linkedinEl = node.querySelector(".card__linkedin");
  const nameEl = node.querySelector(".card__name");
  const titleEl = node.querySelector(".card__title");
  const companyEl = node.querySelector(".card__company");
  const noteEl = node.querySelector(".card__note");

  initialsEl.textContent = initialsFromName(member.name);
  linkedinEl.href = member.linkedin;
  nameEl.textContent = member.name;

  if (member.avatar) {
    imgEl.src = member.avatar;
    imgEl.alt = member.name;
    imgEl.referrerPolicy = "no-referrer";
    imgEl.hidden = false;
    initialsEl.hidden = true;
    imgEl.addEventListener("error", () => {
      imgEl.hidden = true;
      initialsEl.hidden = false;
    });
  }

  if (member.title) {
    titleEl.textContent = member.title;
  } else {
    titleEl.remove();
  }

  if (member.company) {
    companyEl.textContent = member.company;
  } else {
    companyEl.remove();
  }

  if (member.note) {
    noteEl.textContent = member.note;
  } else {
    noteEl.remove();
  }

  return node;
}

function renderGroupedSections() {
  els.membersSections.innerHTML = "";

  const byGroup = new Map(state.groups.map((group) => [group.id, []]));
  for (const member of state.members) {
    if (byGroup.has(member.group)) {
      byGroup.get(member.group).push(member);
    }
  }

  for (const group of state.groups) {
    const groupMembers = byGroup.get(group.id) || [];
    if (groupMembers.length === 0) continue;

    const section = document.createElement("section");
    section.className = "group-section";
    section.setAttribute("aria-label", group.label);

    const head = document.createElement("div");
    head.className = "group-section__head";
    head.innerHTML = `
      <h3 class="group-section__title">${group.label}</h3>
      <span class="group-section__count mono">${groupMembers.length}</span>
    `;
    section.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "members__grid";
    for (const member of groupMembers) {
      grid.appendChild(buildCard(member));
    }
    section.appendChild(grid);

    els.membersSections.appendChild(section);
  }
}

function render() {
  renderGroupedSections();
  els.memberCount.textContent = `${state.members.length} members`;
  els.emptyState.hidden = state.members.length > 0;
}

function init() {
  try {
    state.community = data.community || {};
    state.groups = data.groups || [];
    state.members = (data.members || [])
      .map(enrichMember)
      .filter((member) => member.linkedin);

    if (state.community.name) els.communityName.textContent = state.community.name;
    if (state.community.tagline) els.communityTagline.textContent = state.community.tagline;
    if (state.community.description) els.communityDescription.textContent = state.community.description;
    document.title = `${state.community.name || "Members"} | Members`;

    render();
  } catch (error) {
    els.emptyState.hidden = false;
    els.emptyState.textContent = "メンバーデータを読み込めませんでした。";
    console.error(error);
  }
}

init();
