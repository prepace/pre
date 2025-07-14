export default function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative bg-white rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-700 hover:text-black text-xl"
        >
          ×
        </button>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
