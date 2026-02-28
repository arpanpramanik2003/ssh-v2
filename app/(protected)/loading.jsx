import LoadingSpinner, { CardSkeleton } from '../../components/shared/LoadingSpinner';

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in p-1">
      <CardSkeleton cards={4} />
      <div className="flex justify-center py-10">
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    </div>
  );
}
