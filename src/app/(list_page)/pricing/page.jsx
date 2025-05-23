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
  const { subscriptionStatus, currentPlan, planCycle, subscriptionId, cancelationDate, loading: isLoading } = useSubscription();
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
      await cancelSubscription(subscriptionId);
      window.location.reload();
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
      question: 'How do I reactivate my subscription after cancellation?',
      answer: "To reactivate your subscription, simply go to your profile page, select 'Manage Subscription,' and click on 'Resubscribe.'"
    },
    {
      question: 'How do I purchase additional credits?',
      answer: "You can buy additional credits through the 'Manage Subscription' page in your profile. Additional credits are only available to users with an active subscription."
    },
    {
      question: 'What happens to my credits if I cancel my subscription?',
      answer: "If you cancel your subscription, you have access until the end of your billing cycle and your credits will be locked for 60 days when your plan is inactive. To continue using your credits, you'll need to resubscribe within the 60 days."
    },
    {
      question: 'How does the free trial work?',
      answer: "New users receive 50 free credits valid for 7 days. After this period, any unused free trial credits will expire and be removed from your account."
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
              : 'bg-gray-800  hover:bg-gray-400 hover:text-white'
          }`} 
          onClick={() => togglePricing('monthly')}
        >
          Monthly
        </Button>
        <Button
          className={`px-6 py-2 rounded-md transition-all border ${
            pricingType === 'yearly'
              ? 'selected' 
              : 'bg-gray-800 hover:bg-gray-400 hover:text-white'
          }`}
          onClick={() => togglePricing('yearly')}
        >
          Yearly
        </Button>
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
            className="flex flex-col items-center"
          >
            <div className={`rounded-lg p-6 shadow-lg w-full sm:w-80 md:w-72 lg:w-64 flex flex-col justify-center items-center text-center border-2 ${
              index === 1 ? 'bg-white text-black border-4 border-double border-purple-600' : 'bg-[var(--card-background)]'
           }`}>
            <h3 className="text-l font-bold mb-1">{plan.title}</h3>
            <div className="flex justify-center items-baseline mb-4">
              <span className="text-3xl font-bold">
                {pricingType === 'monthly' ? `$${plan.priceMonthly}` : `$${plan.priceYearly}`}
              </span>
              <span className="text-sm ml-1">
                {pricingType === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            <ul className="mb-4 space-y-2 w-full">
              {plan.features[pricingType].map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <svg className={`h-5 w-5 mr-2 flex-shrink-0`}fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full px-4 py-2 rounded-lg border-2 border-black ${
                isCurrentActivePlan || isCurrentCancelingPlan
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : index === 1
                  ? 'bg-black text-white hover:bg-gray-600'
                  : 'bg-white text-black hover:bg-gray-300'
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
                  ? 'Canceling Subscription'
                  : `Get ${plan.title}`}
            </button>

            </div>
            {/* if the user is subscribed to one of the plans, show 'cancel subscription' */}
            {isCurrentActivePlan && (
              <div className="mt-2">
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors w-full text-left flex items-center text-xs"
                  onClick={handleCancelSubscription}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <path d="M15.5 8.5l-7 7M8.5 8.5l7 7" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Cancel Subscription
                </button>
              </div>
              )}
            
            {/* after the user canceled the plan, show end of users billing period */}
            {isCurrentCancelingPlan && (
              <div className="mt-2 flex items-center text-blue-500 text-sm">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Access until {new Date(cancelationDate).toLocaleDateString()}
              </div>
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