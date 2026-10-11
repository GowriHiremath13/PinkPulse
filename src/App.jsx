import { useEffect, useState } from "react";
import "./App.css";

const starterTasks = [
  { id: 1, title: "Practice Java DSA", category: "Coding", priority: "High", done: false },
  { id: 2, title: "Work on my project", category: "Projects", priority: "High", done: false },
  { id: 3, title: "Study college subjects", category: "College", priority: "Medium", done: false },
  { id: 4, title: "Learn something new", category: "Personal", priority: "Low", done: false },
];

function loadTasks() {
  try {
    const saved = localStorage.getItem("pinkpulse-tasks");
    return saved ? JSON.parse(saved) : starterTasks;
  } catch {
    return starterTasks;
  }
}

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem("pinkpulse-projects"));
    if (!Array.isArray(saved)) return [];
    // Keep older saved projects compatible with this version.
    return saved.map((project) => ({
      ...project,
      steps: Array.isArray(project.steps) ? project.steps : [],
    }));
  } catch {
    return [];
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [activeTab, setActiveTab] = useState("All Tasks");
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("Coding");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [projects, setProjects] = useState(loadProjects);
  const [newProject, setNewProject] = useState("");
  const [projectDrafts, setProjectDrafts] = useState({});
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [bulkDrafts, setBulkDrafts] = useState({});
  const [bulkOpen, setBulkOpen] = useState({});

  useEffect(() => {
    localStorage.setItem("pinkpulse-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("pinkpulse-projects", JSON.stringify(projects));
  }, [projects]);

  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const visibleTasks = tasks.filter((task) => {
    if (activeTab === "Completed") return task.done;
    if (activeTab === "Pending") return !task.done;
    if (activeTab !== "All Tasks") return task.category === activeTab;
    return true;
  });

  function addTask(event) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    if (editingId !== null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? { ...task, title, category, priority, dueDate }
            : task
        )
      );
      setEditingId(null);
    } else {
      setTasks((current) => [
        {
          id: Date.now(),
          title,
          category,
          priority,
          dueDate,
          done: false,
        },
        ...current,
      ]);
    }

    setNewTask("");
    setDueDate("");
    setPriority("Medium");
    setShowForm(false);
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function addProject(event) {
    event.preventDefault();
    const name = newProject.trim();
    if (!name) return;

    setProjects((current) => [
      ...current,
      { id: Date.now(), name, steps: [] },
    ]);
    setNewProject("");
    setShowProjectForm(false);
  }

  function addProjectStep(event, projectId) {
    event.preventDefault();
    const title = (projectDrafts[projectId] || "").trim();
    if (!title) return;

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              steps: [
                ...project.steps,
                { id: crypto.randomUUID(), title, phase: "General", done: false },
              ],
            }
          : project
      )
    );

    setProjectDrafts((current) => ({ ...current, [projectId]: "" }));
  }

  function addBulkSteps(event, projectId) {
    event.preventDefault();

    const rawLines = (bulkDrafts[projectId] || "").split(/\r?\n/);
    let currentPhase = "General";
    const parsedSteps = [];

    rawLines.forEach((rawLine) => {
      let line = rawLine.trim();
      if (!line) return;

      // Phase headings can look like: Phase 1: Setup or Phase 2 - Build UI
      const phaseMatch = line.match(/^phase\s*\d*\s*[:\-–—]\s*(.+)$/i);
      if (phaseMatch) {
        currentPhase = phaseMatch[1].trim() || "General";
        return;
      }

      // Also allow a plain heading ending with a colon, e.g. "Setup:"
      if (/^[^0-9].*:$/.test(line) && !/^\d+[.)]/.test(line)) {
        currentPhase = line.replace(/:$/, "").trim() || "General";
        return;
      }

      line = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
      if (line) parsedSteps.push({ title: line, phase: currentPhase });
    });

    if (parsedSteps.length === 0) return;

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              steps: [
                ...(Array.isArray(project.steps) ? project.steps : []),
                ...parsedSteps.map(({ title, phase }) => ({
                  id: crypto.randomUUID(),
                  title,
                  phase,
                  done: false,
                })),
              ],
            }
          : project
      )
    );

    setBulkDrafts((current) => ({ ...current, [projectId]: "" }));
    setBulkOpen((current) => ({ ...current, [projectId]: false }));
  }

  function toggleProjectPhase(projectId, phase, shouldComplete) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              steps: project.steps.map((step) =>
                (step.phase || "General") === phase
                  ? { ...step, done: shouldComplete }
                  : step
              ),
            }
          : project
      )
    );
  }

  function toggleProjectStep(projectId, stepId) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              steps: project.steps.map((step) =>
                step.id === stepId ? { ...step, done: !step.done } : step
              ),
            }
          : project
      )
    );
  }

  function deleteProjectStep(projectId, stepId) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              steps: project.steps.filter((step) => step.id !== stepId),
            }
          : project
      )
    );
  }

  function deleteProject(projectId) {
    setProjects((current) => current.filter((project) => project.id !== projectId));
  }

  const menuItems = [
    { name: "All Tasks", icon: "◫" },
    { name: "Pending", icon: "◷" },
    { name: "Completed", icon: "✓" },
    { name: "College", icon: "⌂" },
    { name: "Coding", icon: "</>" },
    { name: "Projects", icon: "▧" },
    { name: "Personal", icon: "♡" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-icon">p.</span>
          <span>pink<span className="pink-text">pulse</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeTab === item.name ? "active" : ""}`}
              onClick={() => setActiveTab(item.name)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "All Tasks" && (
                <span className="nav-count">{tasks.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="avatar">G</div>
            <div>
              <strong>My workspace</strong>
              <span>Personal dashboard</span>
            </div>
          </div>
          <p className="sidebar-note">little steps. big dreams. ✿</p>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <span className="breadcrumb">Workspace <span>/</span> {activeTab}</span>
          <div className="topbar-right">
            <span className="live-dot" />
            <span className="saved-label">Saved in this browser</span>
            <div className="avatar small-avatar">G</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR SPACE. YOUR PACE.</p>
            <h1>Make today <span className="pink-text">count.</span> ✳</h1>
            <p className="welcome-subtitle">
              Every little thing you do is building the life you want.
            </p>
          </div>
          <div className="date-card">
            <span className="date-icon">✿</span>
            <div>
              <span className="date-label">TODAY&apos;S FOCUS</span>
              <strong>One thing at a time.</strong>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top"><span>Total tasks</span><span className="stat-icon">◫</span></div>
            <strong className="stat-number">{tasks.length}</strong>
            <span className="stat-caption">Things on your list</span>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Completed</span><span className="stat-icon">✓</span></div>
            <strong className="stat-number">{completed}</strong>
            <span className="stat-caption">Look at you go!</span>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Still to do</span><span className="stat-icon">◷</span></div>
            <strong className="stat-number">{tasks.length - completed}</strong>
            <span className="stat-caption">You&apos;ve got this</span>
          </article>
          <article className="stat-card progress-stat">
            <div className="stat-top"><span>Daily progress</span><span className="stat-icon">↗</span></div>
            <strong className="stat-number">{progress}%</strong>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </article>
        </section>

        <section className="task-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR TO-DO LIST</p>
              <h2>{activeTab}<span className="heading-period">.</span></h2>
            </div>
            <button type="button" className="add-button" onClick={() => setShowForm(!showForm)}>
              <span>＋</span> Add task
            </button>
          </div>

          {showForm && (
            <form className="add-task-form" onSubmit={addTask}>
              <input
                autoFocus
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="What do you want to get done?"
                aria-label="Task name"
                required
              />
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Task category">
                <option>Coding</option>
                <option>College</option>
                <option>Projects</option>
                <option>Personal</option>
              </select>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Task priority">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Due date" />
              <button className="add-button" type="submit">
                {editingId !== null ? "Save changes" : "Add task"}
              </button>
              <button
                className="cancel-button"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setNewTask("");
                  setDueDate("");
                  setPriority("Medium");
                }}
              >
                Cancel
              </button>
            </form>
          )}

          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className={`task-row ${task.done ? "task-done" : ""}`} key={task.id}>
                <button
                  type="button"
                  className={`task-checkbox ${task.done ? "checked" : ""}`}
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                  aria-pressed={task.done}
                >
                  {task.done ? "✓" : ""}
                </button>
                <div className="task-details">
                  {task.dueDate && <span className="task-deadline">Due: {task.dueDate}</span>}
                  <span className="task-title">{task.title}</span>
                  <span className="task-meta">{task.category}</span>
                </div>
                <span className={`priority priority-${(task.priority || "Medium").toLowerCase()}`}>
                  {task.priority || "Medium"}
                </span>
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => {
                    setEditingId(task.id);
                    setNewTask(task.title);
                    setCategory(task.category);
                    setPriority(task.priority || "Medium");
                    setDueDate(task.dueDate || "");
                    setShowForm(true);
                  }}
                  aria-label={`Edit ${task.title}`}
                  title="Edit task"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                  title="Delete task"
                >
                  ×
                </button>
              </article>
            ))}

            {visibleTasks.length === 0 && (
              <div className="empty-state">
                <span>✿</span>
                <h3>Nothing here right now.</h3>
                <p>Add a task or choose another category.</p>
              </div>
            )}
          </div>

          <p className="list-footer"><span>✳</span> Progress, not perfection. You&apos;re doing just fine.</p>
        </section>

        <section className="projects-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR BIG IDEAS</p>
              <h2>Project space<span className="heading-period">.</span></h2>
            </div>
            <button type="button" className="add-button" onClick={() => setShowProjectForm(!showProjectForm)}>
              + New project
            </button>
          </div>

          {showProjectForm && (
            <form className="project-create-form" onSubmit={addProject}>
              <input
                autoFocus
                value={newProject}
                onChange={(event) => setNewProject(event.target.value)}
                placeholder="e.g. LifeFrame SaaS"
                aria-label="Project name"
                required
              />
              <button className="add-button" type="submit">Create project</button>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="empty-state">
              <span>✿</span>
              <h3>Your next big thing starts here.</h3>
              <p>Create a project and break it into small, achievable steps.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => {
                const steps = Array.isArray(project.steps) ? project.steps : [];
                const total = steps.length;
                const done = steps.filter((step) => step.done).length;
                const percent = total ? Math.round((done / total) * 100) : 0;

                return (
                  <article className="project-card" key={project.id}>
                    <div className="project-card-heading">
                      <div className="project-folder-icon"><span>▰</span></div>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteProject(project.id)}
                        aria-label={`Delete project ${project.name}`}
                        title="Delete project"
                      >
                        ×
                      </button>
                    </div>

                    <h3>{project.name}</h3>

                    <div className="project-progress-label">
                      <span>{done} of {total} steps completed</span>
                      <strong>{percent}%</strong>
                    </div>

                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${project.name} progress`}
                    >
                      <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>

                    <div className="project-steps">
                      {[...new Set(steps.map((step) => step.phase || "General"))].map((phase) => {
                        const phaseSteps = steps.filter((step) => (step.phase || "General") === phase);
                        const phaseDone = phaseSteps.length > 0 && phaseSteps.every((step) => step.done);

                        return (
                          <section className="project-phase" key={phase}>
                            <button
                              type="button"
                              className={`phase-heading ${phaseDone ? "phase-complete" : ""}`}
                              onClick={() => toggleProjectPhase(project.id, phase, !phaseDone)}
                              aria-pressed={phaseDone}
                              title={phaseDone ? "Uncheck every step in this phase" : "Complete every step in this phase"}
                            >
                              <span className={`task-checkbox ${phaseDone ? "checked" : ""}`}>
                                {phaseDone ? "✓" : ""}
                              </span>
                              <span className="phase-title">{phase}</span>
                              <span className="phase-count">
                                {phaseSteps.filter((step) => step.done).length}/{phaseSteps.length}
                              </span>
                            </button>

                            {phaseSteps.map((step) => (
                              <div className="project-step" key={step.id}>
                                <button
                                  type="button"
                                  className={`task-checkbox ${step.done ? "checked" : ""}`}
                                  onClick={() => toggleProjectStep(project.id, step.id)}
                                  aria-label={step.done ? "Mark step incomplete" : "Complete step"}
                                  aria-pressed={step.done}
                                >
                                  {step.done ? "✓" : ""}
                                </button>
                                <span className={step.done ? "project-step-done" : ""}>{step.title}</span>
                                <button
                                  type="button"
                                  className="delete-button step-delete"
                                  onClick={() => deleteProjectStep(project.id, step.id)}
                                  aria-label={`Delete step ${step.title}`}
                                  title="Delete step"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </section>
                        );
                      })}
                    </div>

                    <form className="project-step-form" onSubmit={(event) => addProjectStep(event, project.id)}>
                      <input
                        value={projectDrafts[project.id] || ""}
                        onChange={(event) =>
                          setProjectDrafts((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                        placeholder="+ Add a project step"
                        aria-label={`Add step to ${project.name}`}
                      />
                      <button type="submit" aria-label="Add step">+</button>
                    </form>

                    <button
                      type="button"
                      className="bulk-toggle"
                      onClick={() =>
                        setBulkOpen((current) => ({
                          ...current,
                          [project.id]: !current[project.id],
                        }))
                      }
                    >
                      {bulkOpen[project.id] ? "− Close bulk add" : "＋ Paste multiple steps"}
                    </button>

                    {bulkOpen[project.id] && (
                      <form className="bulk-form" onSubmit={(event) => addBulkSteps(event, project.id)}>
                        <label htmlFor={`bulk-${project.id}`}>
                          Paste your checklist — one step per line
                        </label>
                        <textarea
                          id={`bulk-${project.id}`}
                          rows={7}
                          value={bulkDrafts[project.id] || ""}
                          onChange={(event) =>
                            setBulkDrafts((current) => ({
                              ...current,
                              [project.id]: event.target.value,
                            }))
                          }
                          placeholder={"Phase 1: Setup\n1. Fork the repository\n2. Clone the project\n\nPhase 2: Development\n1. Build the UI\n2. Add interactions\n\nPhase 3: Submission\n1. Test the website\n2. Update README"}
                        />
                        <p className="bulk-hint">
                          Numbered lists and bullet points are supported. Blank lines are ignored.
                        </p>
                        <button className="add-button" type="submit">Add all steps</button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="page-footer">
          Made for your next chapter <span>♥</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
