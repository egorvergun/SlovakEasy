import Image from "next/image";
import Link from "next/link";
import './globals.css';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-green-600 p-4 border-box">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">Vitajte v Slovenský pre deti!</h1>
        <p className="text-xl mt-2">Učte sa slovenský jazyk zábavne a ľahko</p>
      </header>
      <main className="flex flex-col items-center">
        <Image
          src="/mascot.png"
          alt="maskot"
          width={150}
          height={150}
          className="mb-6"
        />
        <Link href="/login" legacyBehavior>
          <a className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-lg transition duration-300">
            Začať učenie
          </a>
        </Link>
      </main>
      <footer className="mt-8">
        <p className="text-center text-sm">© 2024 Slovenský pre deti. Všetky práva vyhradené.</p>
      </footer>
    </div>
  );
}