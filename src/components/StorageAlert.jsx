import { AlertCircle } from 'lucide-react';

export default function StorageAlert({ message }) {
  if (!message) return null;

  return (
    <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
