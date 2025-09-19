// src/components/lead/bulk-register/BulkRegistrationButton.tsx
type Props = {
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function BulkRegistrationButton({ onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center rounded-lg
        bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm
        transition-colors duration-200
        hover:bg-green-700 active:bg-green-800
        focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
      "
    >
      {children ?? "Bulk Registration"}
    </button>
  );
}
