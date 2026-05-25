interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📅</div>
      <p>{message}</p>
    </div>
  );
}
