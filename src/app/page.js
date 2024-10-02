import NavigationBar from '../components/NavigationBar';
import EmailForm from '../components/EmailForm';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <main>
      <NavigationBar />
      
      <Hero>
        <h1 className="text-4xl font-bold">Welcome to LensFusion</h1>
        <EmailForm />
      </Hero>
      
    </main>
  );
}
