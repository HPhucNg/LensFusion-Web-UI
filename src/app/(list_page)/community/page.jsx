'use client'
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig'; // Assuming you already have Firebase config set up.
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function Page() {
  const [pins, setPins] = useState([]);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pins'));
        const pinsList = [];
        querySnapshot.forEach((doc) => {
          pinsList.push({ id: doc.id, ...doc.data() });
        });
        setPins(pinsList);
      } catch (error) {
        console.error('Error fetching pins: ', error);
      }
    };

    fetchPins();
  }, []);

  return (
    <main className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />

      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-8">Community Pins</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pins.map((pin) => (
            <div key={pin.id} className="relative">
              <img
                src={pin.img_data}
                alt={pin.title}
                className="object-cover w-full h-60 rounded-xl shadow-2xl"
              />
              <div className="absolute top-0 left-0 bg-black/50 text-white p-3 w-full text-center rounded-b-xl">
                <h3 className="font-semibold">{pin.title}</h3>
                <p>{pin.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Page;
