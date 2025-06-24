// src/app/page.js
import List from '../components/category/List';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="w-full max-w-screen-xl mx-auto">
        <List />
      </div>
    </main>
  );
}
