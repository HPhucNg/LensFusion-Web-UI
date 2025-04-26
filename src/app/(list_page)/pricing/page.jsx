'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import '../style.css';
import Footer from '../../../components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PricingPlans } from '../pricing/plans';
import { auth } from "@/firebase/FirebaseConfig";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSubscription } from '@/context/subscriptionContext';
import { createCheckoutSession } from '../../../../stripe/createCheckoutSession';
import { cancelSubscription } from '../../../../stripe/createCheckoutSession';

function PricingPage() {

  // State to toggle between monthly and yearly pricing
  const [pricingType, setPricingType] = useState('monthly');
  const [user, setUser] = useState(null);
  //subscription info of the user
  const { status: subscriptionStatus, currentPlan, planCycle, subscriptionId, cancelationDate, loading: isLoading } = useSubscription();
  const [hasExpired, setHasExpired] = useState(false);


  //check user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  //checks if user subscription has expired.
  useEffect(() => {
    if (subscriptionStatus === 'canceling' && cancelationDate) {
      const now = new Date();
      const expirationDate = new Date(cancelationDate);
      setHasExpired(now > expirationDate);
    } else {
      setHasExpired(false);
    }
  }, [subscriptionStatus, cancelationDate]);
  
  //navigate to corresponding subscription plan
  const handleSubscription = async (priceId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error:', error);
      alert('Payment cannot be processed. Please try again.');
    }
  };
  
  //handles subscription cancelation
  const handleCancelSubscription = async () => {
    try {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      if (!subscriptionId) {
        console.error('No active subscription found');
        alert('No active subscription found to cancel');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to cancel your subscription?');
      
      if (!confirmed) return;    
     
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Unable to cancel subscription. Please try again.');
    }
  };

  //handle the toggle
  const togglePricing = (type) => {
    setPricingType(type);
  };

  // dynamic rendering
  const faqItems = [
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
      answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }
  ];

  return (
    <>
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black font-sans relative overflow-hidden'>
      <Navbar />
      <h1 className="priceh1">How much is your time worth?</h1>
      <main className="containerPrice">
        <div className="termFees">
        <Button 
          className={`px-6 py-2 rounded-md transition-all border ${
            pricingType === 'monthly'
              ? 'selected' 
              : 'bg-gray-800  hover:bg-gray-700 hover:text-white'
          }`} 
          onClick={() => togglePricing('monthly')}
        >
          Monthly
        </Button>
        <Button
          className={`px-6 py-2 rounded-md transition-all border ${
            pricingType === 'yearly'
              ? 'selected' 
              : 'bg-gray-800 hover:bg-gray-700 hover:text-white'
          }`}
          onClick={() => togglePricing('yearly')}
        >
          Yearly
        </Button>
          <Link href="/pricing/credits">
            <Button>
              Buy Credits
            </Button>
          </Link>
        </div>


        {/* Pricing Cards */}
      {isLoading ? (
        <div className="w-full text-center py-8">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      ) : (
      <section className="flex flex-wrap justify-center gap-6 px-4">
        {PricingPlans.map((plan, index) => {
          const isCurrentActivePlan = subscriptionStatus === 'active' && currentPlan === plan.title && planCycle === pricingType;
          const isCurrentCancelingPlan = subscriptionStatus === 'canceling' && !hasExpired && currentPlan === plan.title && planCycle === pricingType;
          return (
          <div
            key={plan.title}
            className={`rounded-lg p-6 shadow-lg w-full sm:w-80 md:w-72 lg:w-64 h-full flex flex-col justify-center items-center text-center border-2  ${
              index === 1 ? 'bg-white text-black border-4 border-double border-purple-600' : 'bg-[var(--card-background)]'
            }`}
          >
            <h3 className="text-l font-bold mb-1">{plan.title}</h3>
            <div className="flex justify-center items-baseline mb-4">
              <span className="text-3xl font-bold">
                {pricingType === 'monthly' ? `$${plan.priceMonthly}` : `$${plan.priceYearly}`}
              </span>
              <span className="text-sm ml-1">
                {pricingType === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            <ul className="mb-4 space-y-1 list-disc list-inside text-left w-full">
              {plan.features[pricingType].map((feature, index) => (
                <li key={index} className="text-sm">
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full px-4 py-2 rounded-lg ${
                isCurrentActivePlan || isCurrentCancelingPlan
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : index === 1
                  ? 'bg-black text-white hover:bg-gray-600'
                  : 'bg-white text-black hover:bg-gray-500'
              }`}
              onClick={() => {
                const priceId = pricingType === 'monthly' 
                  ? plan.priceIdMonthly 
                  : plan.priceIdYearly;
                handleSubscription(priceId);
              }}
              disabled={isCurrentActivePlan || isCurrentCancelingPlan}
              >
             {isCurrentActivePlan
                  ? 'Subscribed'
                  : isCurrentCancelingPlan
                  ? 'Canceled Subscription'
                  : `Get ${plan.title}`}
            </button>

            {/* if the user is subscribed to one of the plans, show 'cancel subscription' */}
            {isCurrentActivePlan && (
                <button
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-left"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </button>
              )}
            
            {/* after the user canceled the plan, show end of users billing period */}
            {isCurrentCancelingPlan && (
                <span className="text-xs text-green-400">
                Access until {new Date(cancelationDate).toLocaleDateString()}
                </span>
              )}
          </div>
          );
        })}
      </section>
      )}


          {/* FAQ Accordion */}
          <section className="faqItem">
            <h2>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible>
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default PricingPage;