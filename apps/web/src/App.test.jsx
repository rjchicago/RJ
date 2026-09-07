import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { UpcomingEvents } from './components/UpcomingEvents';

vi.mock('./components/ParticleBackground', () => ({ default: () => null }));

const configResponse = (config = {}) => new Response(JSON.stringify({
  turnstileRequired: false,
  turnstileSiteKey: '',
  ...config,
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

const renderContact = () => render(
  <MemoryRouter initialEntries={['/contact']}>
    <App />
  </MemoryRouter>,
);

const renderRoute = (initialEntry) => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <App />
  </MemoryRouter>,
);

describe('contact form', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(configResponse());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('requests runtime config and keeps submit disabled until it resolves', async () => {
    let resolveConfig;
    globalThis.fetch = vi.fn().mockReturnValue(new Promise((resolve) => { resolveConfig = resolve; }));
    renderContact();
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).toBeDisabled();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/config');
    resolveConfig(configResponse());
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('shows an actionable state when captcha is required without a site key', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(configResponse({ turnstileRequired: true }));
    renderContact();
    expect(await screen.findByText('Contact form verification is not configured.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('submits a valid non-captcha form and clears it on success', async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(configResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    renderContact();
    await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled());
    await user.type(screen.getByLabelText('Name'), 'Ryan Jones');
    await user.type(screen.getByLabelText('Email'), 'rj@example.com');
    await user.type(screen.getByLabelText('Message'), 'This is a sufficiently long message.');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(screen.getByText('Message sent. I’ll reply directly.')).toBeInTheDocument());
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(globalThis.fetch).toHaveBeenLastCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
  });

  it('preserves input and reports an API error', async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(configResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unable to send your message right now.' }), { status: 500 }));
    renderContact();
    await waitFor(() => expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled());
    await user.type(screen.getByLabelText('Name'), 'Ryan Jones');
    await user.type(screen.getByLabelText('Email'), 'rj@example.com');
    await user.type(screen.getByLabelText('Message'), 'This is a sufficiently long message.');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText('Unable to send your message right now.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ryan Jones');
  });

  it('renders the contact route under BrowserRouter-compatible routing', async () => {
    renderContact();
    expect(await screen.findByRole('heading', { name: 'Start a conversation' })).toBeInTheDocument();
  });
});

describe('upcoming events', () => {
  afterEach(() => cleanup());

  it('renders the Events route with active navigation and metadata', () => {
    renderRoute('/events');
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });

    expect(screen.getByRole('heading', { name: 'AI education in the community' })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: 'Events' })).toHaveClass('active');
    expect(document.title).toBe('Events | Ryan Jones');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'Upcoming community AI talks, workshops, and courses from Ryan Jones of RJChicago, LLC.');
  });

  it('renders the four Winter 2027 offerings and all twelve occurrences on Events', () => {
    renderRoute('/events');
    const region = screen.getByRole('region', { name: 'Winter 2027 in Park Ridge' });

    expect(within(region).getByRole('heading', { name: 'AI for Everyday Life' })).toBeInTheDocument();
    expect(within(region).getByRole('heading', { name: 'AI for Adults 55+' })).toBeInTheDocument();
    expect(within(region).getByRole('heading', { name: 'Understanding AI' })).toBeInTheDocument();
    expect(within(region).getByRole('heading', { name: 'AI for Parents' })).toBeInTheDocument();
    expect(region.querySelectorAll('time')).toHaveLength(12);
    expect(region).toHaveTextContent('Thu, Jan 7');
    expect(region).toHaveTextContent('Tue, Mar 9');
    expect(region.querySelector('time[dateTime="2027-02-02T19:00:00-06:00"]')).toBeTruthy();
    expect(screen.queryByText('Past events')).not.toBeInTheDocument();
  });

  it('keeps the AI teaser cross-route and removes agenda duplication', () => {
    renderRoute('/ai');
    expect(screen.queryByRole('region', { name: 'Winter 2027 in Park Ridge' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Winter 2027 community programs/i })).toHaveAttribute('href', '/events#upcoming');
    expect(screen.queryByText('Registration details coming soon.')).not.toBeInTheDocument();
  });

  it('keeps unpublished registration details non-interactive on Events', () => {
    renderRoute('/events');
    const region = screen.getByRole('region', { name: 'Winter 2027 in Park Ridge' });

    expect(within(region).getAllByText('Registration details coming soon.')).toHaveLength(4);
    expect(within(region).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Winter 2027 community programs/i })).not.toBeInTheDocument();
  });

  it('scrolls to the upcoming hash target after route navigation', async () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderRoute('/events#upcoming');
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' }));

    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('supports a future registration URL through data only', () => {
    render(
      <UpcomingEvents
        events={[{
          id: 'future-event',
          title: 'Future AI Event',
          partner: 'Park Ridge Park District',
          format: 'Community lecture',
          audience: 'General adults',
          description: 'A future event.',
          occurrences: [{ start: '2027-01-07T18:30:00-06:00', dateLabel: 'Thu, Jan 7', timeLabel: '6:30-8:30 p.m.' }],
          location: { name: 'Centennial Activity Center', address: '100 S. Western Ave., Park Ridge, IL 60068' },
          registrationUrl: 'https://example.com/register',
          status: 'coming-soon',
        }]}
      />,
    );
    const link = screen.getByRole('link', { name: /View details and register for Future AI Event/i });

    expect(link).toHaveAttribute('href', 'https://example.com/register');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
