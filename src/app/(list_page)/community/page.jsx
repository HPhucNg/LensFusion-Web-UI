import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import React from 'react'
//import Pin from '../../../components/Pin.jsx';
//import Modal from '../../../components/Modal.jsx';
//import ModalAndPin from '../../../components/ModalAndPin.jsx';
import FinalBoard from '../../../components/FinalBoard.jsx';

function page() {
  return (
  <>
    <main className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <FinalBoard />

      
    </main>
    <Footer />
  </>
  );
};

export default page