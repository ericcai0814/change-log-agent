import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuestion = vi.fn<(query: string) => Promise<string>>();
const mockClose = vi.fn();

vi.mock('node:readline/promises', () => ({
  createInterface: vi.fn(() => ({
    question: mockQuestion,
    close: mockClose,
  })),
}));

import { confirmPrompt } from './prompt.js';

describe('confirmPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when user types "Y"', async () => {
    mockQuestion.mockResolvedValueOnce('Y');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(true);
    expect(mockClose).toHaveBeenCalled();
  });

  it('should return true when user types "y"', async () => {
    mockQuestion.mockResolvedValueOnce('y');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(true);
  });

  it('should return true when user presses Enter (empty input)', async () => {
    mockQuestion.mockResolvedValueOnce('');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(true);
  });

  it('should return false when user types "n"', async () => {
    mockQuestion.mockResolvedValueOnce('n');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(false);
  });

  it('should return false when user types "N"', async () => {
    mockQuestion.mockResolvedValueOnce('N');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(false);
  });

  it('should return false for other input', async () => {
    mockQuestion.mockResolvedValueOnce('maybe');

    const result = await confirmPrompt('Create file?');

    expect(result).toBe(false);
  });

  it('should include (Y/n) in the prompt', async () => {
    mockQuestion.mockResolvedValueOnce('y');

    await confirmPrompt('Create file?');

    expect(mockQuestion).toHaveBeenCalledWith('Create file? (Y/n) ');
  });

  it('should close readline even if question rejects', async () => {
    mockQuestion.mockRejectedValueOnce(new Error('stdin closed'));

    await expect(confirmPrompt('Create file?')).rejects.toThrow('stdin closed');
    expect(mockClose).toHaveBeenCalled();
  });
});
