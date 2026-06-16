import { useState, useRef, useCallback } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import { AtSign, Bot, Gamepad2, HouseHeart, Info, Music, ShieldPlus, X } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

const courses = [
  {
    id: 'ai-everyday-life',
    title: 'AI for Everyday Life',
    Icon: Bot,
    summary: 'Learn practical ways to use AI for planning, organization, research, writing, and everyday problem-solving.',
    audience: 'Beginner-friendly',
    format: '4 sessions • 90 minutes each',
    description: 'A practical introduction to modern AI tools such as ChatGPT, focused on safe, useful workflows for daily life.',
    learn: [
      'Write useful prompts with context, constraints, and follow-up questions',
      'Use AI for planning, organization, writing, research, and learning',
      'Evaluate AI answers for accuracy and missing context',
      'Protect private information while using public AI tools',
    ],
    sessions: [
      'AI Basics and Getting Started',
      'AI for Home, Family, and Daily Life',
      'AI for Creativity and Fun',
      'AI for Work, Learning, and the Future',
    ],
  },
  {
    id: 'ai-parents',
    title: 'AI for Parents',
    Icon: HouseHeart,
    summary: 'Discover how AI can help support your family, improve communication, and guide children toward responsible technology use.',
    audience: 'Parents & caregivers',
    format: '4 sessions • 90 minutes each',
    description: 'A course for parents, guardians, and caregivers navigating AI in education, homework, online content, and family life.',
    learn: [
      'Understand how children and teens are likely to encounter AI',
      'Use AI for family organization, communication, and learning support',
      'Distinguish responsible learning support from shortcut-taking',
      'Discuss privacy, misinformation, deepfakes, and academic integrity',
    ],
    sessions: [
      'Understanding AI as a Parent',
      'AI for School, Homework, and Learning Support',
      'AI for Family Organization and Everyday Life',
      'Preparing Kids for an AI Future',
    ],
  },
  {
    id: 'ai-active-adults',
    title: 'AI for Active Adults 55+',
    Icon: ShieldPlus,
    summary: 'Explore simple, practical ways AI can help you stay informed, organized, connected, and confident with technology.',
    audience: 'Practical AI skills',
    format: '4 sessions • 90 minutes each',
    description: 'A hands-on, question-friendly course for adults 55+ who want to use AI safely and confidently for everyday tasks.',
    learn: [
      'Use AI for writing, planning, organizing, learning, and hobbies',
      'Ask follow-up questions and revise AI responses',
      'Recognize AI limitations, scams, misinformation, and privacy risks',
      'Create repeatable prompts for practical use after class',
    ],
    sessions: [
      'Getting Comfortable with AI',
      'AI for Communication, Planning, and Everyday Tasks',
      'AI for Hobbies, Learning, and Staying Connected',
      'AI Safety, Scams, and Personal Next Steps',
    ],
  },
];

function App() {
  const [titleHover, setTitleHover] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const titleRef = useRef(null);
  const activeCourse = courses.find((course) => course.id === activeCourseId);
  
  const getTitleBounds = useCallback(() => {
    if (!titleRef.current) return null;
    return titleRef.current.getBoundingClientRect();
  }, []);

  return (
    <>
      <ParticleBackground 
        particleCount={600} 
        titleHover={titleHover}
        getTitleBounds={getTitleBounds}
      />
      
      <div className="container">
        <header className="hero">
          <h1 className="title" ref={titleRef}>
            <span className="title-letters">
              <span className="title-r">R</span>
              <span className="title-j">J</span>
            </span>
            <span 
              className="title-hover-zone"
              onMouseEnter={() => setTitleHover(true)}
              onMouseLeave={() => setTitleHover(false)}
              onClick={() => setTitleHover(prev => !prev)}
              onTouchStart={() => setTitleHover(true)}
              onTouchEnd={() => setTitleHover(false)}
            />
          </h1>
          <p className="subtitle">Software Engineer • Cloud Architect • Educator</p>
          <div className="tagline">Building the future, one commit at a time</div>
        </header>

        <nav className="nav-links">
          <a href="#about" className="nav-link">About</a>
          <a href="#courses" className="nav-link">Courses</a>
          <a href="#projects" className="nav-link">Projects</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>

        <section id="about" className="section glass-panel">
          <h2>About Me</h2>
          <p>
I have over 25 years of experience in technology leadership and currently serve as a Director of Software Engineering, 
leading teams responsible for large-scale cloud and Kubernetes platforms. I have extensive experience evaluating, implementing, 
and integrating Artificial Intelligence into business processes, software applications, engineering workflows, and everyday life.
          </p>
        </section>

        <section id="courses" className="section">
          <h2>Featured Courses</h2>
          <div className="projects-grid">

            {courses.map((course) => {
              const CourseIcon = course.Icon;

              return (
                <div className="project-card glass-panel" key={course.id}>
                  <div className="course-card-header">
                    <div className="project-icon"><CourseIcon aria-hidden="true" /></div>
                    <span className="availability-chip">Coming soon</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.summary}</p>
                  <div className="project-footer">
                    <span className="project-tech">{course.format} • {course.audience}</span>
                    <button
                      className="course-details-button"
                      type="button"
                      onClick={() => setActiveCourseId(course.id)}
                    >
                      <Info aria-hidden="true" />
                      View details
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </section>

        <section id="projects" className="section">
          <h2>Featured Projects</h2>
          <div className="projects-grid">
            
            <div className="project-card glass-panel">
              <div className="project-icon"><img src="/snipps.svg" alt="Snipps" width="24" height="24" /></div>
              <h3>Snipps</h3>
              <p>Like. Fork. Share.<br />HTML/CSS/JS snippets + social.</p>
              <div className="project-footer">
                <span className="project-tech">TypeScript • React</span>
                <div className="project-links">
                  <a href="https://snipps.dev/" target="_blank" rel="noopener noreferrer" className="project-link">🌐 Web</a>
                </div>
              </div>
            </div>
            
            <div className="project-card glass-panel">
              <div className="project-icon"><Music aria-hidden="true" /></div>
              <h3>Overtone</h3>
              <p>MP3 Player with Real-Time Audio Effects and Retro Visualizations</p>
              <div className="project-footer">
                <span className="project-tech">TypeScript • Svelte • Web Audio API</span>
                <div className="project-links">
                  <a href="https://music.rjchicago.com/" target="_blank" rel="noopener noreferrer" className="project-link">🌐 Web</a>
                  <a href="https://github.com/rjchicago/overtone" target="_blank" rel="noopener noreferrer" className="project-link"><FaGithub /> GitHub</a>
                </div>
              </div>
            </div>
            
            <div className="project-card glass-panel">
              <div className="project-icon"><Gamepad2 aria-hidden="true" /></div>
              <h3>TermV</h3>
              <p>High-performance, terminal-based Tetris game written in C with ncurses</p>
              <div className="project-footer">
                <span className="project-tech">C • ncurses • Terminal</span>
                <div className="project-links">
                  <a href="https://snipps.dev/rjchicago/snipps/tetris" target="_blank" rel="noopener noreferrer" className="project-link">🌐 Web (adapted)</a>
                  <a href="https://github.com/rjchicago/termv" target="_blank" rel="noopener noreferrer" className="project-link"><FaGithub /> GitHub</a>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section id="contact" className="section glass-panel">
          <h2>Get In Touch</h2>
          <div className="contact-links">
            <a href="mailto:rjchicago.llc@gmail.com" className="contact-link">
              <AtSign className="contact-icon" /> Email
            </a>
            <a href="https://github.com/rjchicago" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaGithub className="contact-icon" /> GitHub
            </a>
            <a href="https://linkedin.com/in/rjchicago" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaLinkedin className="contact-icon" /> LinkedIn
            </a>
          </div>
        </section>

        <footer className="footer">
          <p>© {new Date().getFullYear()} RJ Chicago • Built with React + Vite</p>
        </footer>
      </div>

      {activeCourse && (
        <div className="modal-backdrop" onClick={() => setActiveCourseId(null)}>
          <section
            className="course-modal glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${activeCourse.id}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-button"
              type="button"
              onClick={() => setActiveCourseId(null)}
              aria-label="Close course details"
            >
              <X aria-hidden="true" />
            </button>
            <span className="availability-chip">Coming soon</span>
            <h2 id={`${activeCourse.id}-title`}>{activeCourse.title}</h2>
            <p>{activeCourse.description}</p>
            <div className="course-modal-meta">
              <span>{activeCourse.format}</span>
              <span>{activeCourse.audience}</span>
            </div>
            <div className="course-modal-grid">
              <div>
                <h3>What You'll Learn</h3>
                <ul>
                  {activeCourse.learn.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Session Outline</h3>
                <ol>
                  {activeCourse.sessions.map((session) => (
                    <li key={session}>{session}</li>
                  ))}
                </ol>
              </div>
            </div>
            <p className="course-modal-note">Availability and registration details coming soon.</p>
          </section>
        </div>
      )}
    </>
  );
}

export default App;
