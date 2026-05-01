import ChoreButton from './ChoreButton';

export default function ChoreList({ chores, onSelect }) {
  if (!chores || chores.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500 text-base animate-pulse">Ladataan...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {chores.map((chore) => (
        <ChoreButton key={chore.id} chore={chore} onClick={onSelect} />
      ))}
    </div>
  );
}
