import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { PriorityBadge, StatusBadge, RoleBadge } from '../components/common/Badge';

describe('Common UI Components', () => {
  it('renders Button correctly with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders disabled Button when isLoading is true', () => {
    render(<Button isLoading={true}>Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders PriorityBadge with correct label', () => {
    render(<PriorityBadge priority="Urgent" />);
    expect(screen.getByText(/Urgent/i)).toBeInTheDocument();
  });

  it('renders StatusBadge with correct status', () => {
    render(<StatusBadge status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders RoleBadge with descriptive role label', () => {
    render(<RoleBadge role="team_leader" />);
    expect(screen.getByText('Team Leader')).toBeInTheDocument();
  });
});
