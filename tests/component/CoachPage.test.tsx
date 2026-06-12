import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachPage from '../../src/app/coach/page';
import { askCoach, scanReceipt } from '../../src/lib/api';

import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');

// Mock api client
jest.mock('../../src/lib/api', () => ({
  askCoach: jest.fn(),
  scanReceipt: jest.fn(),
}));

describe('CoachPage Component', () => {
  let speakMock: jest.Mock;
  let cancelMock: jest.Mock;

  beforeAll(() => {
    speakMock = jest.fn();
    cancelMock = jest.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: speakMock,
        cancel: cancelMock,
      },
      writable: true,
      configurable: true,
    });
    
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    // Simple mock constructor
    (global as any).SpeechSynthesisUtterance = jest.fn().mockImplementation(function(text) {
      return {
        text,
        onstart: null,
        onend: null,
        onerror: null,
      };
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
    });
  });

  it('renders chatbot with initial message and presets', () => {
    render(<CoachPage />);
    
    expect(screen.getByText(/Eco-Sustainability Coach/i)).toBeInTheDocument();
    expect(screen.getByText(/How can I help you build green habits/i)).toBeInTheDocument();
    expect(screen.getByText("How can I reduce my daily car carbon footprint?")).toBeInTheDocument();
  });

  it('sends question on input enter/click and displays reply', async () => {
    (askCoach as jest.Mock).mockResolvedValueOnce({ reply: "Reduce car use by cycling." });

    render(<CoachPage />);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'how to reduce transport emissions?' } });
    
    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);

    expect(screen.getByText('Coach is thinking...')).toBeInTheDocument();

    await waitFor(() => {
      expect(askCoach).toHaveBeenCalledWith(
        [{ role: 'model', parts: [{ text: expect.stringContaining("How can I help you") }] }],
        'how to reduce transport emissions?'
      );
      expect(screen.getByText('Reduce car use by cycling.')).toBeInTheDocument();
    });
  });

  it('sends preset recommendation when clicked', async () => {
    (askCoach as jest.Mock).mockResolvedValueOnce({ reply: "Energy saving is cool." });

    render(<CoachPage />);

    const presetBtn = screen.getByText("What are simple household energy saving hacks?");
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(askCoach).toHaveBeenCalledWith(
        expect.any(Array),
        "What are simple household energy saving hacks?"
      );
      expect(screen.getByText("Energy saving is cool.")).toBeInTheDocument();
    });
  });

  it('handles voice assistant toggle and speaks replies', async () => {
    (askCoach as jest.Mock).mockResolvedValue({ reply: "Speech text response." });

    render(<CoachPage />);

    // Toggle voice enabled
    const voiceBtn = screen.getByLabelText('Enable Voice Assistant');
    fireEvent.click(voiceBtn);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'testing speech' } });
    
    const sendBtn = screen.getByLabelText('Send message');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(speakMock).toHaveBeenCalled();
      expect(cancelMock).toHaveBeenCalled();
    });
  });

  it('uploads file and runs scan receipt logic', async () => {
    const mockScanOutput = {
      scan: { fileName: 'utility.png' },
      result: {
        amount: 120,
        co2Estimate: 54.2,
        rawText: 'Electric utility bill usage details'
      }
    };
    (scanReceipt as jest.Mock).mockResolvedValueOnce(mockScanOutput);

    render(<CoachPage />);

    const fileInput = screen.getByLabelText('Upload utility bill or receipt');
    const file = new File(['mock content'], 'utility.png', { type: 'image/png' });

    // Simulate input change
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Expect button to appear
    const analyzeBtn = screen.getByRole('button', { name: /Analyze Carbon Footprint/i });
    expect(analyzeBtn).toBeInTheDocument();

    // Trigger analysis
    fireEvent.click(analyzeBtn);
    expect(screen.getByText('Scanning Receipts...')).toBeInTheDocument();

    await waitFor(() => {
      expect(scanReceipt).toHaveBeenCalledWith(file);
      expect(screen.getByText('Electric utility bill usage details')).toBeInTheDocument();
      expect(screen.getByText('54.2 kg')).toBeInTheDocument();
    });
  });

  it('shows alerts/errors if scanReceipt API throws', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (scanReceipt as jest.Mock).mockRejectedValueOnce(new Error('Scan Error'));

    render(<CoachPage />);

    const fileInput = screen.getByLabelText('Upload utility bill or receipt');
    const file = new File(['mock content'], 'utility.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const analyzeBtn = screen.getByRole('button', { name: /Analyze Carbon Footprint/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to scan receipt'));
    });

    alertSpy.mockRestore();
  });

  it('handles askCoach failure and displays connection warning', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (askCoach as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    render(<CoachPage />);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'why failed' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText(/I'm having trouble connecting to the coach service/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('triggers send when Enter key is pressed on input field', async () => {
    (askCoach as jest.Mock).mockResolvedValueOnce({ reply: "Enter key worked." });

    render(<CoachPage />);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'test enter key' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Enter key worked.')).toBeInTheDocument();
    });
  });

  it('renders loading skeleton when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });
    render(<CoachPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('does not attempt speech synthesis if speechSynthesis is missing', async () => {
    const originalSpeechSynthesis = window.speechSynthesis;
    delete (window as any).speechSynthesis;

    (askCoach as jest.Mock).mockResolvedValueOnce({ reply: "Speech text response." });

    render(<CoachPage />);

    try {
      const voiceBtn = screen.getByLabelText('Enable Voice Assistant');
      fireEvent.click(voiceBtn);

      const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
      fireEvent.change(input, { target: { value: 'testing speech' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('Speech text response.')).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(window, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true,
      });
    }
  });

  it('displays audio visualizer bars when coach is speaking', async () => {
    speakMock.mockImplementation((utterance) => {
      if (utterance.onstart) utterance.onstart();
    });

    (askCoach as jest.Mock).mockResolvedValueOnce({ reply: "Speaking message" });

    render(<CoachPage />);

    const voiceBtn = screen.getByLabelText('Enable Voice Assistant');
    fireEvent.click(voiceBtn);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'tell me something' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Speaking message')).toBeInTheDocument();
    });

    const audioBars = document.getElementsByClassName('audio-bar');
    expect(audioBars.length).toBeGreaterThan(0);
  });

  it('calls cancel speech when voice assistant is toggled off', async () => {
    render(<CoachPage />);
    const voiceBtn = screen.getByLabelText('Enable Voice Assistant');
    
    fireEvent.click(voiceBtn);
    await waitFor(() => {
      expect(voiceBtn.getAttribute('aria-label')).toBe('Mute Voice Assistant');
    });

    fireEvent.click(voiceBtn);
    await waitFor(() => {
      expect(cancelMock).toHaveBeenCalled();
    });
  });

  it('does not select a file if files are empty or missing', () => {
    render(<CoachPage />);
    const fileInput = screen.getByLabelText('Upload utility bill or receipt');
    
    fireEvent.change(fileInput, { target: { files: [] } });
    
    expect(screen.queryByRole('button', { name: /Analyze Carbon Footprint/i })).not.toBeInTheDocument();
  });

  it('does not send message or perform scans if user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<CoachPage />);

    const input = screen.getByPlaceholderText(/Ask the Eco Coach/i);
    fireEvent.change(input, { target: { value: 'hello coach' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(askCoach).not.toHaveBeenCalled();

    const fileInput = screen.getByLabelText('Upload utility bill or receipt');
    const file = new File(['mock content'], 'utility.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze Carbon Footprint/i });
    fireEvent.click(analyzeBtn);

    expect(scanReceipt).not.toHaveBeenCalled();
  });
});
