export default function Unauthorized() {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-200 text-red-900 p-5">
        <h1 className="text-3xl font-bold">🚫 Access denied</h1>
        <p className="text-lg mb-5">Restricted permission for authorized users.</p>
        <a
          href="/login"
          className="px-5 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition"
        >
          🔙 Back to top
        </a>
      </div>
    );
  }
  