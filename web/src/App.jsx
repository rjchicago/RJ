import { useState, useRef, useCallback } from 'react';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import ParticleBackground from './components/ParticleBackground';
import './App.css';

function App() {
  const [titleHover, setTitleHover] = useState(false);
  const titleRef = useRef(null);
  
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
          <p className="subtitle">Software Engineer • Cloud Architect • Creator</p>
          <div className="tagline">Building the future, one commit at a time</div>
        </header>

        <nav className="nav-links">
          <a href="#about" className="nav-link">About</a>
          <a href="#projects" className="nav-link">Projects</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>

        <section id="about" className="section glass-panel">
          <h2>About Me</h2>
          <p>
            Passionate software engineer with expertise in cloud architecture, 
            containerization, and building delightful user experiences. 
            I love exploring the intersection of creativity and technology.
          </p>
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
              <div className="project-icon">🎶</div>
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
              <div className="project-icon">🎮</div>
              <h3>TermV</h3>
              <p>High-performance, terminal-based Tetris game written in C with ncurses</p>
              <div className="project-footer">
                <span className="project-tech">C • ncurses • Terminal</span>
                <div className="project-links">
                  <a href="https://github.com/rjchicago/termv" target="_blank" rel="noopener noreferrer" className="project-link"><FaGithub /> GitHub</a>
                </div>
              </div>
            </div>
            
            <div className="project-card glass-panel">
              <div className="project-icon">🐳</div>
              <h3>Rancher KF</h3>
              <p>Kubernetes Fleet management and automation tools</p>
              <div className="project-footer">
                <span className="project-tech">Go • Kubernetes • Docker</span>
                <div className="project-links">
                  <a href="https://github.com/rjchicago/rancher-kf" target="_blank" rel="noopener noreferrer" className="project-link"><FaGithub /> GitHub</a>
                </div>
              </div>
            </div>
            
            <div className="project-card glass-panel">
              <div className="project-icon">✨</div>
              <h3>PARTi</h3>
              <p>Real-time particle simulator with face and hand tracking using MediaPipe</p>
              <div className="project-footer">
                <span className="project-tech">JavaScript • MediaPipe • Canvas</span>
                <div className="project-links">
                  <a href="https://parti.rjchicago.com/" target="_blank" rel="noopener noreferrer" className="project-link">🌐 Web</a>
                  <a href="https://github.com/rjchicago/parti" target="_blank" rel="noopener noreferrer" className="project-link"><FaGithub /> GitHub</a>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section id="contact" className="section glass-panel">
          <h2>Get In Touch</h2>
          <div className="contact-links">
            <a href="https://github.com/rjchicago" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaGithub className="contact-icon" /> GitHub
            </a>
            <a href="https://linkedin.com/in/rjchicago" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaLinkedin className="contact-icon" /> LinkedIn
            </a>
            <a href="https://x.com/rjchicago" target="_blank" rel="noopener noreferrer" className="contact-link">
              <FaXTwitter className="contact-icon" /> X
            </a>
          </div>
        </section>

        <footer className="footer">
          <p>© {new Date().getFullYear()} RJ Chicago • Built with React + Vite</p>
        </footer>
      </div>
    </>
  );
}

export default App;
