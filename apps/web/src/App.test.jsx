import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

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
