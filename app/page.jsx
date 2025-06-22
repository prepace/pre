// src/app/page.js
import List from '../components/List'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md mt-8">
        <List />
      </div>
    </main>
  )
}