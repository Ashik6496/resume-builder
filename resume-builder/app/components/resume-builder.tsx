"use client";

          import { useEffect, useEffectEvent, useRef, useState } from "react";
          import type { CSSProperties } from "react";
          import AuthForm from "./auth-form";
          import type { Education, Experience, Resume } from "@/lib/resume";

          const initialResume: Resume = {
            name: "Alex Morgan",
            role: "Product Designer",
            email: "alex.morgan@email.com",
            phone: "+1 (415) 555-0138",
            location: "San Francisco, CA",
            website: "alexmorgan.design",
            summary:
              "Product designer with 6+ years of experience turning complex problems into thoughtful, easy-to-use digital products. I bring clarity to ambiguous spaces and help teams ship work that makes a difference.",
            experience: [
              {
                role: "Senior Product Designer",
                company: "Northstar Studio",
                dates: "2022 — Present",
                details:
                  "Led the redesign of a core analytics platform, improving task completion by 32%.\nBuilt a shared design system that brought 4 product teams onto one consistent workflow.",
              },
              {
                role: "Product Designer",
                company: "Fieldwork, Inc.",
                dates: "2019 — 2022",
                details:
                  "Designed end-to-end onboarding for a product serving 18,000+ small businesses.\nPartnered with research and engineering to take 3 new features from concept to launch.",
              },
            ],
            education: [
              {
                degree: "BFA, Communication Design",
                school: "California College of the Arts",
                dates: "2015 — 2019",
              },
            ],
            skills: "Product strategy, Interaction design, Prototyping, Figma, Research",
          };

          const accents = [
            { name: "Forest", value: "#315c4c" },
            { name: "Terracotta", value: "#b45d43" },
            { name: "Ink", value: "#34445c" },
            { name: "Plum", value: "#765c72" },
          ];

          const templates = [
            { id: "editorial", name: "Editorial" },
            { id: "minimal", name: "Minimal" },
            { id: "modern", name: "Modern" },
            { id: "executive", name: "Executive" },
            { id: "compact", name: "Compact" },
            { id: "creative", name: "Creative" },
            { id: "technical", name: "Technical" },
            { id: "academic", name: "Academic" },
            { id: "elegant", name: "Elegant" },
            { id: "bold", name: "Bold" },
          ] as const;

          type TemplateId = (typeof templates)[number]["id"];

          export default function Home() {
            const [resume, setResume] = useState<Resume>(initialResume);
            const [user, setUser] = useState<{ email: string } | null>(null);
            const [resumeId, setResumeId] = useState<string | null>(null);
            const [resumeOptions, setResumeOptions] = useState<{ id: string; title: string }[]>([]);
            const [authLoading, setAuthLoading] = useState(true);
            const [resumeLoading, setResumeLoading] = useState(false);
            const [saveState, setSaveState] = useState<"loading" | "saving" | "saved" | "error">("loading");
            const [notice, setNotice] = useState("");
            const readyToSave = useRef(false);
            const [accent, setAccent] = useState(accents[0].value);
            const [template, setTemplate] = useState<TemplateId>("editorial");
            const [activeTab, setActiveTab] = useState<"content" | "style">("content");

            async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
              const response = await fetch(url, {
                ...init,
                headers: { "Content-Type": "application/json", ...init?.headers },
              });
              const result = (await response.json().catch(() => ({}))) as T & { error?: string };
              if (!response.ok) throw new Error(result.error || "Request failed.");
              return result;
            }

            async function refreshResumeOptions() {
              const result = await requestJson<{ resumes: { id: string; title: string }[] }>("/api/resumes");
              setResumeOptions(result.resumes);
              return result.resumes;
            }

            async function openResume(id: string) {
              setResumeLoading(true);
              readyToSave.current = false;
              try {
                const result = await requestJson<{ id: string; data: Resume }>(`/api/resumes/${id}`);
                setResume(result.data);
                setResumeId(result.id);
                readyToSave.current = true;
                setSaveState("saved");
                setNotice("");
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Unable to open this resume.");
              } finally {
                setResumeLoading(false);
              }
            }

            async function createResume() {
              setResumeLoading(true);
              readyToSave.current = false;
              try {
                const result = await requestJson<{ id: string; data: Resume }>("/api/resumes", {
                  method: "POST",
                  body: JSON.stringify({ data: initialResume }),
                });
                setResume(result.data);
                setResumeId(result.id);
                setResumeOptions((current) => [{ id: result.id, title: result.data.name || "Untitled resume" }, ...current]);
                readyToSave.current = true;
                setSaveState("saved");
                setNotice("");
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Unable to create a resume.");
              } finally {
                setResumeLoading(false);
              }
            }

            async function handleAuthenticated(authenticatedUser: { email: string }) {
              setUser(authenticatedUser);
              setAuthLoading(false);
              setResumeLoading(true);
              readyToSave.current = false;
              try {
                const options = await refreshResumeOptions();
                if (options.length > 0) {
                  await openResume(options[0].id);
                } else {
                  await createResume();
                }
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Unable to load your workspace.");
              } finally {
                setResumeLoading(false);
              }
            }

            const restoreAuthenticatedUser = useEffectEvent(handleAuthenticated);

            useEffect(() => {
              let cancelled = false;
              async function restoreSession() {
                try {
                  const result = await requestJson<{ user: { email: string } | null }>("/api/auth/session");
                  if (cancelled) return;
                  if (result.user) await restoreAuthenticatedUser(result.user);
                } catch {
                  if (!cancelled) setNotice("Unable to connect to the app server.");
                } finally {
                  if (!cancelled) setAuthLoading(false);
                }
              }
              void restoreSession();
              return () => { cancelled = true; };
            }, []);

            useEffect(() => {
              if (!resumeId || !readyToSave.current) return;
              const timeout = window.setTimeout(async () => {
                setSaveState("saving");
                try {
                  await requestJson(`/api/resumes/${resumeId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ data: resume }),
                  });
                  setResumeOptions((current) => current.map((item) =>
                    item.id === resumeId ? { ...item, title: resume.name || "Untitled resume" } : item,
                  ));
                  setSaveState("saved");
                } catch (error) {
                  setSaveState("error");
                  setNotice(error instanceof Error ? error.message : "Unable to save your changes.");
                }
              }, 500);
              return () => window.clearTimeout(timeout);
            }, [resume, resumeId]);

            const updateResume = <K extends keyof Resume>(key: K, value: Resume[K]) => {
              setResume((current) => ({ ...current, [key]: value }));
            };

            const updateExperience = (index: number, key: keyof Experience, value: string) => {
              setResume((current) => ({
                ...current,
                experience: current.experience.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, [key]: value } : item,
                ),
              }));
            };

            const updateEducation = (index: number, key: keyof Education, value: string) => {
              setResume((current) => ({
                ...current,
                education: current.education.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, [key]: value } : item,
                ),
              }));
            };

            async function deleteCurrentResume() {
              if (!resumeId || !window.confirm("Delete this resume permanently?")) return;
              try {
                await requestJson(`/api/resumes/${resumeId}`, { method: "DELETE" });
                const remaining = resumeOptions.filter((item) => item.id !== resumeId);
                setResumeOptions(remaining);
                readyToSave.current = false;
                if (remaining.length) {
                  await openResume(remaining[0].id);
                } else {
                  setResume(initialResume);
                  setResumeId(null);
                  await createResume();
                }
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Unable to delete this resume.");
              }
            }

            async function signOut() {
              await fetch("/api/auth/logout", { method: "POST" });
              readyToSave.current = false;
              setUser(null);
              setResumeId(null);
              setResumeOptions([]);
              setResume(initialResume);
              setSaveState("loading");
            }

            const filledFields = [resume.name, resume.role, resume.email, resume.summary].filter(
              (value) => value.trim().length > 0,
            ).length;

            if (authLoading) {
              return <main className="auth-loading">Loading your workspace…</main>;
            }
            if (!user) {
              return <AuthForm onAuthenticated={(authenticatedUser) => void handleAuthenticated(authenticatedUser)} />;
            }

            return (
              <main className="studio" style={{ "--resume-accent": accent } as CSSProperties}>
                <header className="topbar">
                  <a className="brand" href="#top" aria-label="Folio home">
                    <span className="brand-mark">f.</span>
                    <span>folio<span className="brand-period">.</span></span>
                  </a>
                  <div className="resume-manager">
                    <select
                      aria-label="Choose a resume"
                      className="resume-select"
                      disabled={resumeLoading}
                      value={resumeId ?? ""}
                      onChange={(event) => void openResume(event.target.value)}
                    >
                      {resumeOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                    <button className="new-resume-button" disabled={resumeLoading} onClick={() => void createResume()} type="button">+ New</button>
                    <span className="save-state"><span className={`save-dot ${saveState === "error" ? "save-dot-error" : ""}`} />{saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : "Saved to account"}</span>
                  </div>
                  <div className="topbar-actions">
                    <button className="account-button" onClick={() => void deleteCurrentResume()} type="button">Delete</button>
                    <button className="account-button" onClick={() => void signOut()} type="button">Sign out</button>
                    <button className="export-button" onClick={() => window.print()} type="button">
                      <span aria-hidden="true">↓</span> Export PDF
                    </button>
                  </div>
                </header>

                <div className="workspace" id="top">
                  <section className="editor-panel" aria-label="Resume editor">
                    {notice && <p className="workspace-notice" role="status">{notice}</p>}
                    <div className="editor-heading">
                      <div>
                        <p className="eyebrow">YOUR WORKSPACE</p>
                        <h1>Make it yours.</h1>
                      </div>
                      <div className="completion" aria-label={`${filledFields} of 4 essentials completed`}>
                        <span>{filledFields}/4</span>
                        <span className="completion-label">essentials</span>
                      </div>
                    </div>

                    <div className="editor-tabs" role="tablist" aria-label="Editor options">
                      <button
                        className={activeTab === "content" ? "editor-tab active" : "editor-tab"}
                        onClick={() => setActiveTab("content")}
                        role="tab"
                        aria-selected={activeTab === "content"}
                        type="button"
                      >
                        Content
                      </button>
                      <button
                        className={activeTab === "style" ? "editor-tab active" : "editor-tab"}
                        onClick={() => setActiveTab("style")}
                        role="tab"
                        aria-selected={activeTab === "style"}
                        type="button"
                      >
                        Style
                      </button>
                    </div>

                    {activeTab === "content" ? (
                      <div className="editor-content">
                        <section className="form-section">
                          <div className="section-heading"><span className="section-number">01</span><h2>About you</h2></div>
                          <div className="form-grid">
                            <label className="field full-field">Full name<input value={resume.name} onChange={(event) => updateResume("name", event.target.value)} placeholder="Your name" /></label>
                            <label className="field full-field">Professional title<input value={resume.role} onChange={(event) => updateResume("role", event.target.value)} placeholder="What do you do?" /></label>
                            <label className="field">Email<input value={resume.email} onChange={(event) => updateResume("email", event.target.value)} placeholder="you@email.com" /></label>
                            <label className="field">Phone<input value={resume.phone} onChange={(event) => updateResume("phone", event.target.value)} placeholder="Your phone" /></label>
                            <label className="field">Location<input value={resume.location} onChange={(event) => updateResume("location", event.target.value)} placeholder="City, Country" /></label>
                            <label className="field">Website<input value={resume.website} onChange={(event) => updateResume("website", event.target.value)} placeholder="yourwebsite.com" /></label>
                            <label className="field full-field">A little about you<textarea value={resume.summary} onChange={(event) => updateResume("summary", event.target.value)} placeholder="A short, thoughtful introduction..." rows={4} /></label>
                          </div>
                        </section>

                        <section className="form-section">
                          <div className="section-heading"><span className="section-number">02</span><h2>Experience</h2></div>
                          {resume.experience.map((item, index) => (
                            <div className="entry-form" key={`experience-${index}`}>
                              <div className="entry-topline"><span>ROLE {String(index + 1).padStart(2, "0")}</span><button className="text-button remove-button" onClick={() => updateResume("experience", resume.experience.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove</button></div>
                              <div className="form-grid">
                                <label className="field">Job title<input value={item.role} onChange={(event) => updateExperience(index, "role", event.target.value)} placeholder="Product designer" /></label>
                                <label className="field">Company<input value={item.company} onChange={(event) => updateExperience(index, "company", event.target.value)} placeholder="Company name" /></label>
                                <label className="field full-field">Dates<input value={item.dates} onChange={(event) => updateExperience(index, "dates", event.target.value)} placeholder="2022 — Present" /></label>
                                <label className="field full-field">What you did<textarea value={item.details} onChange={(event) => updateExperience(index, "details", event.target.value)} placeholder="Add one achievement per line" rows={3} /></label>
                              </div>
                            </div>
                          ))}
                          <button className="add-button" onClick={() => updateResume("experience", [...resume.experience, { role: "", company: "", dates: "", details: "" }])} type="button"><span>+</span> Add experience</button>
                        </section>

                        <section className="form-section">
                          <div className="section-heading"><span className="section-number">03</span><h2>Education</h2></div>
                          {resume.education.map((item, index) => (
                            <div className="entry-form" key={`education-${index}`}>
                              <div className="entry-topline"><span>EDUCATION {String(index + 1).padStart(2, "0")}</span><button className="text-button remove-button" onClick={() => updateResume("education", resume.education.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove</button></div>
                              <div className="form-grid">
                                <label className="field full-field">Degree or qualification<input value={item.degree} onChange={(event) => updateEducation(index, "degree", event.target.value)} placeholder="B.A. in Design" /></label>
                                <label className="field">School<input value={item.school} onChange={(event) => updateEducation(index, "school", event.target.value)} placeholder="University name" /></label>
                                <label className="field">Dates<input value={item.dates} onChange={(event) => updateEducation(index, "dates", event.target.value)} placeholder="2015 — 2019" /></label>
                              </div>
                            </div>
                          ))}
                          <button className="add-button" onClick={() => updateResume("education", [...resume.education, { degree: "", school: "", dates: "" }])} type="button"><span>+</span> Add education</button>
                        </section>

                        <section className="form-section last-form-section">
                          <div className="section-heading"><span className="section-number">04</span><h2>Skills</h2></div>
                          <label className="field full-field">Your strengths<textarea value={resume.skills} onChange={(event) => updateResume("skills", event.target.value)} placeholder="Separate each skill with a comma" rows={3} /></label>
                        </section>
                      </div>
                    ) : (
                      <div className="style-content">
                        <section className="style-section">
                          <div className="section-heading"><span className="section-number">01</span><h2>Choose a template</h2></div>
                          <div className="template-options">
                            {templates.map((item) => (
                              <button
                                aria-pressed={template === item.id}
                                className={`template-choice ${template === item.id ? "selected" : ""}`}
                                key={item.id}
                                onClick={() => setTemplate(item.id)}
                                type="button"
                              >
                                <span className={`template-mini template-mini-${item.id}`} aria-hidden="true"><i /><i /><i /><i /></span>
                                <span>{item.name}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                        <section className="style-section">
                          <div className="section-heading"><span className="section-number">02</span><h2>Accent color</h2></div>
                          <div className="color-options" aria-label="Accent color">
                            {accents.map((color) => (
                              <button className={`color-choice ${accent === color.value ? "selected" : ""}`} key={color.value} onClick={() => setAccent(color.value)} style={{ "--swatch": color.value } as CSSProperties} type="button" aria-label={color.name} aria-pressed={accent === color.value} />
                            ))}
                          </div>
                        </section>
                        <p className="style-note">Your changes appear instantly in the preview. Your resume stays saved in this browser.</p>
                      </div>
                    )}
                  </section>

                  <section className="preview-panel" aria-label="Resume preview">
                    <div className="preview-toolbar"><div><span className="preview-live-dot" /> LIVE PREVIEW</div><span>A4 · 1 PAGE</span></div>
                    <article className={`resume-paper template-${template} ${template === "minimal" ? "resume-minimal" : ""}`}>
                      <header className="resume-header">
                        <p className="resume-kicker">CURRICULUM VITAE</p>
                        <h2>{resume.name || "Your Name"}</h2>
                        <p className="resume-role">{resume.role || "Your professional title"}</p>
                        <div className="resume-contact">
                          {[resume.email, resume.phone, resume.location, resume.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}
                        </div>
                      </header>

                      {resume.summary && <section className="resume-section"><h3>Profile</h3><p className="resume-summary">{resume.summary}</p></section>}

                      {resume.experience.some((item) => item.role || item.company || item.details) && (
                        <section className="resume-section"><h3>Experience</h3><div className="resume-entries">
                          {resume.experience.filter((item) => item.role || item.company || item.details).map((item, index) => (
                            <div className="resume-entry" key={`preview-experience-${index}`}>
                              <div className="resume-entry-heading"><div><h4>{item.role || "Position"}</h4><p>{item.company}</p></div><span>{item.dates}</span></div>
                              {item.details && <ul>{item.details.split("\n").filter(Boolean).map((detail, detailIndex) => <li key={`${detailIndex}-${detail}`}>{detail}</li>)}</ul>}
                            </div>
                          ))}
                        </div></section>
                      )}

                      {resume.education.some((item) => item.degree || item.school) && (
                        <section className="resume-section"><h3>Education</h3><div className="resume-entries">
                          {resume.education.filter((item) => item.degree || item.school).map((item, index) => (
                            <div className="resume-entry resume-education" key={`preview-education-${index}`}>
                              <div className="resume-entry-heading"><div><h4>{item.degree || "Qualification"}</h4><p>{item.school}</p></div><span>{item.dates}</span></div>
                            </div>
                          ))}
                        </div></section>
                      )}

                      {resume.skills.trim() && <section className="resume-section"><h3>Expertise</h3><div className="skill-list">{resume.skills.split(",").map((skill) => skill.trim()).filter(Boolean).map((skill) => <span key={skill}>{skill}</span>)}</div></section>}
                      <footer className="resume-footer"><span>{resume.name || "YOUR NAME"}</span><span>FOLIO · RESUME</span></footer>
                    </article>
                  </section>
                </div>
              </main>
            );
          }
