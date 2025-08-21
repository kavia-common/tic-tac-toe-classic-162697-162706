import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe title', () => {
  render(<App />);
  expect(screen.getByText(/Tic Tac Toe/i)).toBeInTheDocument();
});

test('renders mode buttons', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Player vs Player/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Player vs AI/i })).toBeInTheDocument();
});
