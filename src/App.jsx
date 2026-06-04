import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Theramotion Web App</h1>
        <p className="mt-2 text-slate-600">
          React + Tailwind CSS setup is ready. Edit <code>src/App.jsx</code> to get started.
        </p>
        <button
          type="button"
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          onClick={() => setCount((current) => current + 1)}
        >
          Count is {count}
        </button>
      </div>
    </main>
  )
}

export default App
