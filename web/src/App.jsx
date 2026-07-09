import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Link, Route, Routes, useLocation } from 'react-router-dom';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';
import {
  ArrowRight,
  AtSign,
  Bot,
  BrainCircuit,
  CalendarDays,
  Gamepad2,
  HouseHeart,
  Info,
  Library,
  MessagesSquare,
  Music,
  ShieldCheck,
  ShieldPlus,
  Users,
  X,
} from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

const courses = [
  {
    id: 'ai-adults-55',
    title: 'AI for Adults 55+',
    Icon: ShieldPlus,
    summary: 'A friendly introduction to using AI for writing, planning, hobbies, travel, and everyday tasks.',
    audience: 'Adults 55+',
    format: 'Single 120-minute workshop',
    description: 'A hands-on, question-friendly workshop for adults 55+ who want to understand AI and use it safely and confidently. No technical experience is required.',
    learn: [
      'Explain AI assistants in plain language',
      'Use AI for writing, planning, organizing, learning, and hobbies',
      'Ask follow-up questions and improve AI responses',
      'Recognize scams, misinformation, privacy risks, and AI limitations',
    ],
    sessions: [
      'Understanding AI and getting started',
      'Practical AI for everyday tasks',
      'Safety, privacy, and verification',
      'Building confidence and next steps',
    ],
    outlineLabel: 'Workshop Outline',
  },
  {
    id: 'ai-everyday-life',
    title: 'AI for Everyday Life',
    Icon: Bot,
    summary: 'Practical ways to use AI for planning, organization, research, writing, learning, and problem-solving.',
    audience: 'General adults',
    format: '4 weekly 90-minute sessions',
    description: 'A beginner-friendly course that helps participants understand modern AI tools and build practical workflows they can continue using after class.',
    learn: [
      'Explain what modern AI tools can and cannot do',
      'Write useful prompts with context, constraints, and follow-up questions',
      'Use AI for planning, organization, writing, research, and learning',
      'Evaluate answers for accuracy while protecting private information',
    ],
    sessions: [
      'AI Basics and Getting Started',
      'AI for Home, Family, and Daily Life',
      'AI for Creativity and Fun',
      'AI for Work, Learning, and the Future',
    ],
    outlineLabel: 'Session Outline',
  },
  {
    id: 'ai-parents',
    title: 'AI for Parents',
    Icon: HouseHeart,
    summary: 'Guidance for families navigating AI in homework, creativity, online content, and digital communication.',
    audience: 'Parents & caregivers',
    format: '4 weekly 90-minute sessions',
    description: 'A practical course for parents, guardians, and caregivers of school-age children. It focuses on healthy, critical, and transparent AI use at home.',
    learn: [
      'Understand how children and teens encounter AI',
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
    outlineLabel: 'Session Outline',
  },
];

const projects = [
  {
    title: 'Snipps',
    Icon: null,
    image: '/snipps.svg',
    description: 'A social platform for creating, forking, and sharing HTML, CSS, and JavaScript snippets.',
    tech: 'TypeScript • React',
    links: [{ label: 'Visit Snipps', href: 'https://snipps.dev/' }],
  },
  {
    title: 'Overtone',
    Icon: Music,
    description: 'An MP3 player with real-time audio effects and retro visualizations.',
    tech: 'TypeScript • Svelte • Web Audio API',
    links: [
      { label: 'Web app', href: 'https://music.rjchicago.com/' },
      { label: 'GitHub', href: 'https://github.com/rjchicago/overtone', github: true },
    ],
  },
  {
    title: 'TermV',
    Icon: Gamepad2,
    description: 'A high-performance terminal Tetris game written in C with ncurses.',
    tech: 'C • ncurses • Terminal',
    links: [
      { label: 'Web adaptation', href: 'https://snipps.dev/rjchicago/snipps/tetris' },
      { label: 'GitHub', href: 'https://github.com/rjchicago/termv', github: true },
    ],
  },
];

function App() {
  const [titleHover, setTitleHover] = useState(false);
  const titleRef = useRef(null);

  const getTitleBounds = useCallback(() => titleRef.current?.getBoundingClientRect() ?? null, []);

  return (
    <>
      <ParticleBackground particleCount={600} titleHover={titleHover} getTitleBounds={getTitleBounds} />
      <RouteEffects />
      <div className="site-shell">
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<HomePage titleRef={titleRef} setTitleHover={setTitleHover} />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

const routeMetadata = {
  '/': {
    title: 'Ryan Jones | Technology Leader & AI Educator',
    description: 'Technology leadership and practical AI education from Ryan Jones of RJChicago, LLC.',
  },
  '/ai': {
    title: 'AI Speaking & Education | Ryan Jones',
    description: 'Approachable AI talks, workshops, and courses for adults, parents, libraries, and community organizations.',
  },
  '/about': {
    title: 'About Ryan Jones | RJChicago, LLC',
    description: 'Meet Ryan Jones, a technology leader and educator with more than 25 years of experience.',
  },
  '/projects': {
    title: 'Projects | Ryan Jones',
    description: 'Independent software projects by Ryan Jones, including Snipps, Overtone, and TermV.',
  },
};

function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const metadata = routeMetadata[pathname] ?? {
      title: 'Page Not Found | Ryan Jones',
      description: 'Ryan Jones — technology leader and AI educator.',
    };
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
  }, [pathname]);

  return null;
}

function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="RJ Chicago home">RJ</Link>
      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/ai">AI Speaking & Education</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/projects">Projects</NavLink>
      </nav>
      <a className="header-contact" href="mailto:rjchicago.llc@gmail.com">Contact</a>
    </header>
  );
}

function HomePage({ titleRef, setTitleHover }) {
  return (
    <>
      <section className="home-hero">
        <div className="hero-mark" ref={titleRef}>
          <span className="title-letters"><span>R</span><span>J</span></span>
          <span
            className="title-hover-zone"
            onMouseEnter={() => setTitleHover(true)}
            onMouseLeave={() => setTitleHover(false)}
            onClick={() => setTitleHover((current) => !current)}
            role="presentation"
          />
        </div>
        <p className="eyebrow">Ryan Jones • RJChicago, LLC</p>
        <h1>Technology leadership.<br /><span>Practical AI education.</span></h1>
        <p className="hero-copy">
          I help people and organizations understand technology, navigate change, and use artificial intelligence safely, responsibly, and confidently.
        </p>
        <div className="button-row">
          <Link className="button button-primary" to="/ai">Explore AI programs <ArrowRight /></Link>
          <Link className="button button-secondary" to="/about">About Ryan</Link>
        </div>
      </section>

      <section className="section split-feature glass-panel">
        <div>
          <p className="eyebrow">Speaking & education</p>
          <h2>AI made approachable</h2>
        </div>
        <div>
          <p>Community talks, workshops, and multi-session courses designed for adults, parents, and older adults—without technical jargon or hype.</p>
          <Link className="text-link" to="/ai">View topics and programs <ArrowRight /></Link>
        </div>
      </section>

      <section className="section home-experience">
        <div className="section-heading">
          <p className="eyebrow">Experience</p>
          <h2>Built on real-world technology leadership</h2>
        </div>
        <div className="stat-grid">
          <article className="glass-panel stat-card"><strong>25+</strong><span>years in technology and leadership</span></article>
          <article className="glass-panel stat-card"><BrainCircuit /><span>AI implementation and integration experience</span></article>
          <article className="glass-panel stat-card"><Users /><span>Teaching, mentoring, and community involvement</span></article>
        </div>
      </section>

      <ContactCta title="Planning an AI program or community event?" copy="Let’s discuss a practical session for your audience." />
    </>
  );
}

function AiPage() {
  const [activeCourseId, setActiveCourseId] = useState(null);
  const activeCourse = courses.find((course) => course.id === activeCourseId);

  return (
    <>
      <PageHero
        eyebrow="AI speaking & education"
        title="Practical AI for real life"
        copy="Approachable talks, workshops, and courses that help community audiences understand AI, use it effectively, and make informed decisions about its risks."
      >
        <a className="button button-primary" href="mailto:rjchicago.llc@gmail.com?subject=AI%20program%20inquiry">Discuss a program <ArrowRight /></a>
      </PageHero>

      <section className="section">
        <div className="section-heading narrow-heading">
          <p className="eyebrow">Speaking topics</p>
          <h2>Flexible sessions for community audiences</h2>
          <p>These themes can be adapted into introductory talks, interactive workshops, or facilitated discussions for libraries, park districts, parent groups, and community organizations.</p>
        </div>
        <div className="topic-grid">
          <TopicCard icon={BrainCircuit} title="Understanding AI" copy="What modern AI is, where people already encounter it, what it does well, and where it fails." />
          <TopicCard icon={MessagesSquare} title="AI for Everyday Life" copy="Useful workflows for planning, writing, organization, learning, research, and creative projects." />
          <TopicCard icon={HouseHeart} title="Families, School & AI" copy="Homework, digital literacy, academic integrity, family guidelines, and preparing children for an AI-enabled world." />
          <TopicCard icon={ShieldCheck} title="Safety, Scams & Misinformation" copy="Privacy, hallucinations, deepfakes, verification habits, and recognizing AI-enabled scams." />
        </div>
        <p className="availability-note"><CalendarDays /> New speaking sessions are currently being developed for local community venues.</p>
      </section>

      <section className="section" id="programs">
        <div className="section-heading narrow-heading">
          <p className="eyebrow">Courses & workshops</p>
          <h2>Programs ready for community partners</h2>
          <p>Beginner-friendly instruction built around hands-on examples, discussion, and repeatable skills. Each session can include an optional 30-minute Q&A following the core program.</p>
        </div>
        <div className="card-grid">
          {courses.map((course) => {
            const CourseIcon = course.Icon;
            return (
              <article className="content-card glass-panel" key={course.id}>
                <div className="card-topline">
                  <span className="icon-box"><CourseIcon /></span>
                  <span className="status-chip">Available for proposals</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.summary}</p>
                <div className="card-footer">
                  <span>{course.format}</span>
                  <button type="button" onClick={() => setActiveCourseId(course.id)}><Info /> View details</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section audience-section glass-panel">
        <div>
          <p className="eyebrow">Designed for your audience</p>
          <h2>Clear, useful, and non-technical</h2>
        </div>
        <div className="check-list">
          <p><ShieldCheck /> Safety and responsible use are built into every topic.</p>
          <p><Users /> Content is adapted to the audience’s experience and concerns.</p>
          <p><Library /> Formats work for libraries, community programs, and parent organizations.</p>
        </div>
      </section>

      <ContactCta title="Bring practical AI education to your community" copy="Tell me about your audience, format, and goals. I’ll help shape the right session." />
      {activeCourse && <CourseModal course={activeCourse} onClose={() => setActiveCourseId(null)} />}
    </>
  );
}

function TopicCard({ icon, title, copy }) {
  const TopicIcon = icon;
  return <article className="topic-card glass-panel"><TopicIcon /><h3>{title}</h3><p>{copy}</p></article>;
}

function CourseModal({ course, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="course-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby={`${course.id}-title`} onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close course details"><X /></button>
        <span className="status-chip">Available for proposals</span>
        <h2 id={`${course.id}-title`}>{course.title}</h2>
        <p>{course.description}</p>
        <div className="course-meta"><span>{course.format}</span><span>{course.audience}</span><span>Optional 30-minute Q&A following</span></div>
        <div className="course-modal-grid">
          <div><h3>Learning Objectives</h3><ul>{course.learn.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>{course.outlineLabel}</h3><ol>{course.sessions.map((item) => <li key={item}>{item}</li>)}</ol></div>
        </div>
        <a className="text-link modal-inquiry" href={`mailto:rjchicago.llc@gmail.com?subject=${encodeURIComponent(`${course.title} inquiry`)}`}>Ask about this program <ArrowRight /></a>
      </section>
    </div>
  );
}

function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Ryan" title="Technology leader, educator, and community advocate" copy="More than 25 years of helping people and organizations learn, adapt, and build with technology." />
      <section className="section bio-layout glass-panel">
        <img className="profile-photo" src="/profile.png" alt="Ryan Jones" />
        <div className="bio-copy">
          <h2>Ryan Jones</h2>
          <p>Ryan is a Park Ridge resident, father of four, youth sports coach, technology leader, and educator with over 25 years of experience helping people learn and adapt to new technology.</p>
          <p>He currently serves as a Director of Software Engineering, leading teams responsible for large-scale cloud and Kubernetes platforms. He has extensive experience evaluating, implementing, and integrating artificial intelligence into business processes, software applications, engineering workflows, and everyday life.</p>
          <p>Throughout his career, Ryan has taught and mentored others through technical training, leadership development, youth sports coaching, and community involvement. He specializes in making complex technology approachable and practical and believes AI literacy is becoming an essential life skill.</p>
          <p>His teaching focuses on helping people use AI safely, responsibly, and confidently.</p>
        </div>
      </section>
      <ContactCta title="Interested in working together?" copy="Get in touch about speaking, education, or technology opportunities." />
    </>
  );
}

function ProjectsPage() {
  return (
    <>
      <PageHero eyebrow="Projects" title="Things I build" copy="Independent projects created to explore ideas, tools, interfaces, and the occasional bit of nostalgia." />
      <section className="section project-page-section">
        <div className="card-grid">
          {projects.map((project) => {
            const ProjectIcon = project.Icon;
            return (
              <article className="content-card glass-panel" key={project.title}>
                <span className="icon-box">{project.image ? <img src={project.image} alt="" /> : <ProjectIcon />}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="card-footer project-card-footer">
                  <span>{project.tech}</span>
                  <div className="project-links">
                    {project.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.github && <FaGithub />} {link.label}</a>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function PageHero({ eyebrow, title, copy, children }) {
  return <section className="page-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p>{children && <div className="button-row">{children}</div>}</section>;
}

function ContactCta({ title, copy }) {
  return (
    <section className="section contact-cta glass-panel">
      <div><p className="eyebrow">Let’s connect</p><h2>{title}</h2><p>{copy}</p></div>
      <a className="button button-primary" href="mailto:rjchicago.llc@gmail.com"><AtSign /> Email Ryan</a>
    </section>
  );
}

function NotFoundPage() {
  return <section className="page-hero not-found"><p className="eyebrow">404</p><h1>Page not found</h1><Link className="button button-primary" to="/">Return home</Link></section>;
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><Link className="brand" to="/">RJ</Link><p>Technology leadership and practical AI education.</p></div>
      <div className="social-links">
        <a href="mailto:rjchicago.llc@gmail.com" aria-label="Email"><AtSign /></a>
        <a href="https://github.com/rjchicago" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>
        <a href="https://linkedin.com/in/rjchicago" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
      </div>
      <p className="copyright">© {new Date().getFullYear()} RJChicago, LLC</p>
    </footer>
  );
}

export default App;
