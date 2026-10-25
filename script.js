
"use strict";

// ============================================
// SkillScope AI - Career Skill Analysis Engine
// ============================================

const skills = [
  {
    id: "python",
    name: "Python Programming",
    description: "Programming fundamentals and data handling",
    project: "Build a student marks analysis tool.",
    task: "Practice variables, functions, lists, dictionaries, and basic data analysis."
  },
  {
    id: "sql",
    name: "SQL & Databases",
    description: "Queries, tables, filtering, and joins",
    project: "Create a small student database and query it.",
    task: "Practice SELECT, WHERE, GROUP BY, JOIN, and aggregate functions."
  },
  {
    id: "statistics",
    name: "Statistics",
    description: "Averages, probability, and data interpretation",
    project: "Analyze a dataset of student marks.",
    task: "Review mean, median, variance, probability, and correlation."
  },
  {
    id: "visualization",
    name: "Data Visualization",
    description: "Charts, dashboards, and visual storytelling",
    project: "Build a sales or student performance dashboard.",
    task: "Learn how to choose suitable charts and explain the patterns they reveal."
  },
  {
    id: "ml",
    name: "Machine Learning",
    description: "Models, predictions, and evaluation",
    project: "Build a simple classification model with a sample dataset.",
    task: "Learn train/test splits, basic regression, classification, and model evaluation."
  }
];

// Target proficiency levels for each career.
// These are illustrative project settings, not universal job requirements.
const careers = {
  analyst: {
    name: "Data Analyst",
    targets: {
      python: 4,
      sql: 5,
      statistics: 4,
      visualization: 4,
      ml: 2
    }
  },
  scientist: {
    name: "Data Scientist",
    targets: {
      python: 5,
      sql: 4,
      statistics: 5,
      visualization: 3,
      ml: 5
    }
  },
  ml: {
    name: "Machine Learning Engineer",
    targets: {
      python: 5,
      sql: 3,
      statistics: 4,
      visualization: 2,
      ml: 5
    }
  }
};

const STORAGE_KEY = "skillscope-assessment-v1";

const careerSelect = document.getElementById("careerSelect");
const skillsContainer = document.getElementById("skillsContainer");
const analyzeBtn = document.getElementById("analyzeBtn");
const printBtn = document.getElementById("printBtn");

let lastAssessment = null;

// ============================================
// 1. Create the skill sliders
// ============================================

function renderSkills(savedRatings = {}) {
  skillsContainer.replaceChildren();

  skills.forEach((skill) => {
    const row = document.createElement("div");
    row.className = "skill-row";

    const nameBox = document.createElement("div");

    const name = document.createElement("div");
    name.className = "skill-name";
    name.textContent = skill.name;

    const description = document.createElement("div");
    description.className = "skill-detail";
    description.textContent = skill.description;

    nameBox.append(name, description);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "5";
    slider.step = "1";
    slider.className = "skill-range";
    slider.id = `skill-${skill.id}`;
    slider.setAttribute("aria-label", `${skill.name} skill rating`);
    slider.value = String(
      Number.isInteger(savedRatings[skill.id])
        ? Math.max(0, Math.min(5, savedRatings[skill.id]))
        : 0
    );

    const number = document.createElement("output");
    number.className = "skill-number";
    number.id = `value-${skill.id}`;
    number.htmlFor = slider.id;
    number.textContent = `${slider.value}/5`;

    slider.addEventListener("input", () => {
      number.textContent = `${slider.value}/5`;

      const percentage = (Number(slider.value) / 5) * 100;
      slider.style.background =
        `linear-gradient(to right, #9b80ff ${percentage}%, #303349 ${percentage}%)`;

      document.getElementById("inputHint").textContent =
        "Ratings changed. Analyze your skills to refresh your results.";
    });

    row.append(nameBox, slider, number);
    skillsContainer.append(row);

    // Draw the slider's initial color.
    const initialPercentage = (Number(slider.value) / 5) * 100;
    slider.style.background =
      `linear-gradient(to right, #9b80ff ${initialPercentage}%, #303349 ${initialPercentage}%)`;
  });
}

// ============================================
// 2. Read and validate the student's ratings
// ============================================

function getRatings() {
  const ratings = {};

  for (const skill of skills) {
    const slider = document.getElementById(`skill-${skill.id}`);
    const value = Number(slider.value);

    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error(`Please enter a valid rating for ${skill.name}.`);
    }

    ratings[skill.id] = value;
  }

  return ratings;
}

// ============================================
// 3. Calculate the career readiness indicator
// ============================================

function analyzeSkills() {
  const career = careers[careerSelect.value];

  if (!career) {
    throw new Error("Please select a valid career.");
  }

  const ratings = getRatings();

  const breakdown = skills.map((skill) => {
    const current = ratings[skill.id];
    const target = career.targets[skill.id];
    const cappedCurrent = Math.min(current, target);
    const gap = Math.max(0, target - current);

    return {
      ...skill,
      current,
      target,
      gap,
      contribution: cappedCurrent / target
    };
  });

  const readiness = Math.round(
    (breakdown.reduce((sum, item) => sum + item.contribution, 0) /
      breakdown.length) *
      100
  );

  // Larger gaps appear first.
  const priorities = [...breakdown]
    .filter((item) => item.gap > 0)
    .sort((a, b) => {
      const gapDifference =
        b.gap / b.target - a.gap / a.target;

      return gapDifference || b.gap - a.gap;
    });

  const strengths = breakdown
    .filter((item) => item.current >= item.target)
    .sort((a, b) => b.current - a.current);

  return {
    careerName: career.name,
    ratings,
    readiness,
    breakdown,
    priorities,
    strengths,
    assessedAt: new Date().toISOString()
  };
}

// ============================================
// 4. Update the top summary cards
// ============================================

function updateSummary(result) {
  document.getElementById("readinessStat").innerHTML =
    `${result.readiness}<small>%</small>`;

  document.getElementById("readinessCaption").textContent =
    `For ${result.careerName}`;

  document.getElementById("assessedStat").innerHTML =
    `${result.breakdown.length}<small>/5</small>`;

  document.getElementById("gapsStat").textContent =
    result.priorities.length;

  document.getElementById("scoreValue").textContent =
    `${result.readiness}%`;

  document.getElementById("scoreRing").style.setProperty(
    "--score",
    result.readiness
  );

  let title = "Your journey is underway";
  let description =
    "Keep learning and practice the skills most relevant to your chosen career.";

  if (result.readiness === 100) {
    title = "All targets reached!";
    description =
      "Your self-reported ratings meet all the current skill targets. Keep practicing with real projects.";
  } else if (result.readiness >= 80) {
    title = "Strong foundation";
    description =
      "Your ratings are close to the selected targets. Focus on your remaining gaps and practical projects.";
  } else if (result.readiness >= 60) {
    title = "Good progress";
    description =
      "You have a starting foundation. Focus on the highest-priority gaps to improve your profile.";
  } else if (result.readiness >= 40) {
    title = "Building your foundation";
    description =
      "Choose a few important skills and practice them consistently with small projects.";
  } else {
    title = "Your learning journey starts here";
    description =
      "Start with fundamentals and gradually build practical skills. Progress matters more than a single score.";
  }

  document.getElementById("scoreTitle").textContent = title;
  document.getElementById("scoreDescription").textContent = description;
}

// ============================================
// 5. Show the skill comparison chart
// ============================================

function renderBreakdown(result) {
  const container = document.getElementById("breakdownContainer");
  container.replaceChildren();

  result.breakdown.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "breakdown-item";

    const top = document.createElement("div");
    top.className = "breakdown-top";

    const label = document.createElement("span");
    label.textContent = item.name;

    const value = document.createElement("span");
    value.textContent = `${item.current}/5 · Target ${item.target}/5`;

    top.append(label, value);

    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("role", "img");
    track.setAttribute(
      "aria-label",
      `${item.name}: ${item.current} out of 5, target ${item.target}`
    );

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(item.current / 5) * 100}%`;

    track.append(fill);
    wrapper.append(top, track);
    container.append(wrapper);
  });
}

// ============================================
// 6. Display strengths and skill gaps
// ============================================

function renderTags(containerId, items, type, emptyMessage) {
  const container = document.getElementById(containerId);
  container.replaceChildren();

  if (items.length === 0) {
    const message = document.createElement("span");
    message.className = "empty-state";
    message.textContent = emptyMessage;
    container.append(message);
    return;
  }

  items.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = type === "gap" ? "tag gap" : "tag";

    tag.textContent = type === "gap"
      ? `${item.name} · ${item.gap} level${item.gap === 1 ? "" : "s"} to target`
      : `${item.name} · ${item.current}/5`;

    container.append(tag);
  });
}

// ============================================
// 7. Generate a personalized learning roadmap
// ============================================

function renderRoadmap(result) {
  const container = document.getElementById("roadmapContainer");
  container.replaceChildren();

  const recommendations = result.priorities.slice(0, 3);

  if (recommendations.length === 0) {
    const message = document.createElement("div");
    message.className = "roadmap-empty empty-state";
    message.textContent =
      "All selected targets are reached! Build a portfolio project to test your skills in practice.";
    container.append(message);
    return;
  }

  recommendations.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "roadmap-item";

    const step = document.createElement("div");
    step.className = "roadmap-step";
    step.textContent = `0${index + 1}`;

    const content = document.createElement("div");

    const heading = document.createElement("h3");
    heading.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.task;

    const meta = document.createElement("div");
    meta.className = "roadmap-meta";

    const gap = document.createElement("span");
    gap.textContent =
      `↗ ${item.gap} proficiency level${item.gap === 1 ? "" : "s"} to target`;

    const project = document.createElement("span");
    project.textContent = `✦ Practice: ${item.project}`;

    meta.append(gap, project);
    content.append(heading, description, meta);
    card.append(step, content);
    container.append(card);
  });
}

// ============================================
// 8. Save the assessment in this browser
// ============================================

function saveAssessment(result) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return true;
  } catch (error) {
    console.warn("Assessment could not be saved:", error);
    return false;
  }
}

function loadAssessment() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    const data = JSON.parse(saved);

    if (
      !data ||
      !careers[Object.keys(careers).find(
        (key) => careers[key].name === data.careerName
      )] ||
      !data.ratings ||
      !skills.every(
        (skill) =>
          Number.isInteger(data.ratings[skill.id]) &&
          data.ratings[skill.id] >= 0 &&
          data.ratings[skill.id] <= 5
      )
    ) {
      return;
    }

    const careerKey = Object.keys(careers).find(
      (key) => careers[key].name === data.careerName
    );

    careerSelect.value = careerKey;
    renderSkills(data.ratings);

    // Recalculate from the current code and stored ratings.
    lastAssessment = analyzeSkills();
    displayResults(lastAssessment, false);

    document.getElementById("inputHint").textContent =
      "Your last saved assessment has been restored.";
  } catch (error) {
    console.warn("Saved assessment could not be restored:", error);
  }
}

// ============================================
// 9. Display all results
// ============================================

function displayResults(result, shouldSave = true) {
  updateSummary(result);
  renderBreakdown(result);

  renderTags(
    "strengthsContainer",
    result.strengths,
    "strength",
    "Keep practicing to build your first strength."
  );

  renderTags(
    "gapsContainer",
    result.priorities,
    "gap",
    "No skill gaps against these selected targets."
  );

  renderRoadmap(result);

  if (shouldSave) {
    const saved = saveAssessment(result);

    document.getElementById("inputHint").textContent = saved
      ? "Analysis complete! Your assessment has been saved in this browser."
      : "Analysis complete! Browser storage is unavailable, so this result may not persist.";
  }

  // Move the results into view after the user clicks Analyze.
  document.getElementById("results").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// ============================================
// 10. Connect the buttons and page events
// ============================================

analyzeBtn.addEventListener("click", () => {
  try {
    lastAssessment = analyzeSkills();
    displayResults(lastAssessment);
  } catch (error) {
    document.getElementById("inputHint").textContent = error.message;
  }
});

careerSelect.addEventListener("change", () => {
  document.getElementById("inputHint").textContent =
    "Career changed. Analyze your skills to update the results.";

  // Clear stale results so the previous career's score is not misleading.
  lastAssessment = null;

  document.getElementById("readinessStat").innerHTML = "—<small>%</small>";
  document.getElementById("readinessCaption").textContent =
    "Analyze your new career profile";
  document.getElementById("assessedStat").innerHTML = "0<small>/5</small>";
  document.getElementById("gapsStat").textContent = "—";
  document.getElementById("scoreValue").textContent = "—%";
  document.getElementById("scoreRing").style.setProperty("--score", 0);
  document.getElementById("scoreTitle").textContent = "Ready when you are";
  document.getElementById("scoreDescription").textContent =
    "Analyze your ratings against the new career targets.";

  document.getElementById("breakdownContainer").replaceChildren();
  document.getElementById("strengthsContainer").replaceChildren();
  document.getElementById("gapsContainer").replaceChildren();

  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "Analyze your skills to generate your roadmap.";
  document.getElementById("roadmapContainer").replaceChildren(empty);

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear the previous assessment:", error);
  }
});

printBtn.addEventListener("click", () => {
  if (!lastAssessment) {
    document.getElementById("inputHint").textContent =
      "Please analyze your skills before exporting your report.";
    document.getElementById("assessment").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    return;
  }

  window.print();
});

// ============================================
// 11. Start the application
// ============================================

renderSkills();
loadAssessment();
