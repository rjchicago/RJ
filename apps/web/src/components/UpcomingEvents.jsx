import { CalendarDays, Clock3, ExternalLink, MapPin } from 'lucide-react';
import upcomingEvents from '../data/upcomingEvents';

export function UpcomingEvents({ events = upcomingEvents }) {
  return (
    <section className="section upcoming-events" id="upcoming" aria-labelledby="upcoming-events-heading">
      <div className="section-heading narrow-heading">
        <p className="eyebrow">Upcoming events</p>
        <h2 id="upcoming-events-heading">Winter 2027 in Park Ridge</h2>
        <p>These community programs are scheduled for Winter 2027. Registration links and final partner details will be added when official postings are available.</p>
      </div>
      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id}>
            <article className="event-card glass-panel">
              <div className="event-card-header">
                <span className="event-icon"><CalendarDays aria-hidden="true" /></span>
                <div className="event-card-labels">
                  <span className="event-partner">{event.partner}</span>
                  <span className="status-chip status-chip-coming-soon">Coming soon</span>
                </div>
              </div>
              <h3>{event.title}</h3>
              <div className="event-meta"><span>{event.format}</span><span>{event.audience}</span></div>
              <p>{event.description}</p>
              <div className="event-location">
                <MapPin aria-hidden="true" />
                <span>{event.location.name}<small>{event.location.address}</small></span>
              </div>
              <div className="event-dates">
                <p className="event-dates-label">Dates</p>
                <ol>
                  {event.occurrences.map((occurrence) => (
                    <li key={occurrence.start}>
                      <time dateTime={occurrence.start}>{occurrence.dateLabel}</time>
                      <span>{occurrence.timeLabel}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {event.registrationUrl ? (
                <a className="event-registration" href={event.registrationUrl} target="_blank" rel="noreferrer" aria-label={`View details and register for ${event.title}`}>
                  View details &amp; register <ExternalLink aria-hidden="true" />
                </a>
              ) : (
                <p className="event-status"><Clock3 aria-hidden="true" /> Registration details coming soon.</p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
