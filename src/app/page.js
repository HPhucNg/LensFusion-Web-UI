import NavigationBar from '../components/NavigationBar';
import EmailForm from '../components/EmailForm';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <main>
      <NavigationBar />
      
      <Hero>
        <h1 className="text-5xl font-bold">Welcome to LensFusion</h1>
        <h4 className="text-2xl font-regular">Generate product shots in seconds with an Al
        photographer</h4>
        <h5 className="text-1xl font-regular">Coming Soon | Sign Up Today</h5>
        <EmailForm />
        
      </Hero>
      
    </main>
  );
}
