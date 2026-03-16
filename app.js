const projectGridEl = document.getElementById('projectGrid');
const projectDetailEl = document.getElementById('projectDetail');
const detailContentEl = document.getElementById('detailContent');
const backToListBtn = document.getElementById('backToList');
const searchInput = document.getElementById('searchInput');
const difficultyFilter = document.getElementById('difficultyFilter');
const ageFilter = document.getElementById('ageFilter');

const navLinks = document.querySelectorAll('.nav-link');
const homeSection = document.getElementById('homeSection');
const homeRecommendationsEl = document.getElementById('homeRecommendations');
const dashboardSection = document.getElementById('dashboardSection');
const helpSection = document.getElementById('helpSection');

const chatMessagesEl = document.getElementById('chatMessages');
const chatFormEl = document.getElementById('chatForm');
const chatInputEl = document.getElementById('chatInput');

const totalProjectsEl = document.getElementById('totalProjectsCount');
const easyProjectsEl = document.getElementById('easyProjectsCount');
const mediumProjectsEl = document.getElementById('mediumProjectsCount');
const hardProjectsEl = document.getElementById('hardProjectsCount');
const latestProjectsListEl = document.getElementById('latestProjectsList');

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

let allProjects = [];
let viewedProjects = [];

function setActiveSection(sectionId) {
  if (!homeSection || !dashboardSection || !helpSection) return;

  homeSection.classList.toggle('hidden', sectionId !== 'homeSection');
  dashboardSection.classList.toggle('hidden', sectionId !== 'dashboardSection');
  helpSection.classList.toggle('hidden', sectionId !== 'helpSection');

  navLinks.forEach(link => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('nav-link-active', isActive);
  });
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    if (u.searchParams.get('v')) {
      return u.searchParams.get('v');
    }
    const parts = u.pathname.split('/');
    return parts[parts.length - 1];
  } catch (e) {
    return '';
  }
}

function createProjectCard(project){

  const card = document.createElement("div");
  card.className = "project-card";

  card.innerHTML = `
    <div class="project-card-thumb">
      <img src="${project.thumbnailUrl}" style="width:100%; height:100%; object-fit:cover;">
    </div>
    <h3>${project.title}</h3>
    <p>${project.shortDescription}</p>
  `;

  // ADD THIS LINE
  card.addEventListener("click", () => showProjectDetail(project));

  return card;
}

function renderProjectGrid(projects) {
  projectGridEl.innerHTML = '';
  if (!projects.length) {
    projectGridEl.innerHTML = '<p>No projects found. Try a different search or filter.</p>';
    return;
  }

  projects.forEach(project => {
    const card = createProjectCard(project, showProjectDetail);
    projectGridEl.appendChild(card);
  });
}

function renderHomeRecommendations(projects) {
  if (!homeRecommendationsEl) return;
  homeRecommendationsEl.innerHTML = '';

  if (!projects.length) {
    homeRecommendationsEl.innerHTML = '<p>No projects yet. Add some in your projects.json file.</p>';
    return;
  }

  // Primary recommendation: just show the first project as the main card
  const primary = projects[0];
  const card = createProjectCard(primary, p => {
    setActiveSection('homeSection');
    showProjectDetail(p);
  });
  homeRecommendationsEl.appendChild(card);
}

function showProjectDetail(project) {
  const videoId = extractYouTubeId(project.youtubeUrl || '');
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

  detailContentEl.innerHTML = `
    <h2>${project.title}</h2>
    <p>${project.shortDescription || ''}</p>
    <div class="detail-layout">
      <div>
        ${
          embedUrl
            ? `<div class="video-wrapper">
                 <iframe
                   src="${embedUrl}"
                   title="YouTube video player"
                   frameborder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                   allowfullscreen
                 ></iframe>
               </div>`
            : '<p>Video unavailable. Please check the YouTube link in the backend data.</p>'
        }
      </div>
      <div>
        <div class="materials-list">
          <h3 class="section-title">Materials Needed</h3>
          ${
            project.materials && project.materials.length
              ? `<ul>${project.materials.map(m => `<li>${m}</li>`).join('')}</ul>`
              : '<p>No materials listed yet.</p>'
          }
        </div>
        <div class="science-text" style="margin-top: 1rem;">
          <h3 class="section-title">Science Behind It</h3>
          <p>${project.scienceBehind || 'No explanation added yet. Update this in your projects.json file or via the API.'}</p>
        </div>
      </div>
    </div>
  `;

  projectDetailEl.classList.remove('hidden');
  projectDetailEl.scrollIntoView({ behavior: 'smooth' });

  // Track viewed projects for the dashboard (unique by id)
  if (!viewedProjects.some(p => p.id === project.id)) {
    viewedProjects.push(project);
    renderDashboard(viewedProjects);
  }
}

function hideProjectDetail() {
  projectDetailEl.classList.add('hidden');
}

function applyFilters() {
  const query = (searchInput.value || '').toLowerCase();
  const difficulty = difficultyFilter.value;
  const age = ageFilter.value;

  const filtered = allProjects.filter(p => {
    const matchesSearch =
      !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(query)));

    const matchesDifficulty = !difficulty || p.difficulty === difficulty;
    const matchesAge = !age || p.ageRange === age;

    return matchesSearch && matchesDifficulty && matchesAge;
  });

  renderProjectGrid(filtered);
}

async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) {
      throw new Error('Failed to load projects');
    }
    allProjects = await res.json();
    renderProjectGrid(allProjects);
    renderHomeRecommendations(allProjects);
    // Initially, dashboard shows only viewed projects (none yet)
    renderDashboard(viewedProjects);
  } catch (err) {
    console.error(err);
    projectGridEl.innerHTML = '<p>Could not load projects. Check that the server is running.</p>';
  }
}

function renderDashboard(projects) {
  if (!projects || !projects.length) {
    if (totalProjectsEl) totalProjectsEl.textContent = '0';
    if (easyProjectsEl) easyProjectsEl.textContent = '0';
    if (mediumProjectsEl) mediumProjectsEl.textContent = '0';
    if (hardProjectsEl) hardProjectsEl.textContent = '0';
    if (latestProjectsListEl) latestProjectsListEl.innerHTML = '';
    return;
  }

  const total = projects.length;
  const easy = projects.filter(p => p.difficulty === 'Easy').length;
  const medium = projects.filter(p => p.difficulty === 'Medium').length;
  const hard = projects.filter(p => p.difficulty === 'Hard').length;

  if (totalProjectsEl) totalProjectsEl.textContent = String(total);
  if (easyProjectsEl) easyProjectsEl.textContent = String(easy);
  if (mediumProjectsEl) mediumProjectsEl.textContent = String(medium);
  if (hardProjectsEl) hardProjectsEl.textContent = String(hard);

  if (latestProjectsListEl) {
    latestProjectsListEl.innerHTML = '';
    const latest = projects.slice(-5).reverse();
    latest.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `${p.title} <span>(${p.difficulty || 'Easy'} • ${p.ageRange || '7-12'})</span>`;
      latestProjectsListEl.appendChild(li);
    });
  }
}

function appendChatMessage(text, sender) {
  if (!chatMessagesEl) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-message ${sender}`;
  bubble.textContent = text;
  chatMessagesEl.appendChild(bubble);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function getBotReply(questionRaw) {
  const question = (questionRaw || '').toLowerCase();

  if (!question.trim()) {
    return 'Ask me anything about the projects, materials, or which experiment fits your age.';
  }

  if (question.includes('age') || question.match(/\b(\d{1,2})\b/)) {
    return 'Most projects are great for ages 7–12. Check the age badge on each card, or tell an adult if you are unsure.';
  }

  if (question.includes('materials') || question.includes('need')) {
    return 'Open a project card and look under “Materials Needed”. You can also ask me about common replacements, like using tape instead of glue in some builds.';
  }

  if (question.includes('safety') || question.includes('safe')) {
    return 'Always have an adult nearby, protect your eyes, and keep water away from plugs or electronics. If something feels unsafe, stop and ask an adult first.';
  }

  if (question.includes('start') || question.includes('first') || question.includes('beginner')) {
    return 'A great first project is the Balloon Rocket or Lava Lamp. They use simple materials and clearly show the science in action.';
  }

  if (question.includes('science') || question.includes('behind')) {
    return 'Each project has a “Science Behind It” section that explains what is happening. Read that part after you finish building to connect the activity to the concept.';
  }

  return "I'm a simple helper bot for this DIY site. Try asking about ages, materials, safety, or which project you should start with.";
}

// Events
if (backToListBtn) {
  backToListBtn.addEventListener('click', () => {
    hideProjectDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}
if (difficultyFilter) {
  difficultyFilter.addEventListener('change', applyFilters);
}
if (ageFilter) {
  ageFilter.addEventListener('change', applyFilters);
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const sectionId = link.dataset.section;
    setActiveSection(sectionId);
  });
});

if (chatFormEl && chatInputEl) {
  chatFormEl.addEventListener('submit', event => {
    event.preventDefault();
    const text = chatInputEl.value.trim();
    if (!text) return;
    appendChatMessage(text, 'user');
    const reply = getBotReply(text);
    appendChatMessage(reply, 'bot');
    chatInputEl.value = '';
    chatInputEl.focus();
  });

  appendChatMessage("Hi! I'm the DIY helper bot. Ask me about projects, materials, or safety.", 'bot');
}

setActiveSection('homeSection');
loadProjects();

