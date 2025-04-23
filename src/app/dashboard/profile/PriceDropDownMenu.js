import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useSubscription } from '@/context/subscriptionContext';
import { createCheckoutSession, reactivateSubscription } from '../../../../stripe/createCheckoutSession';
import { PricingPlans } from '@/app/(list_page)/pricing/plans';

export const PriceDropDownMenu = ({ setActiveTab, pricingType: parentPricingType, setPricingType: setParentPricingType, isResubscribe = false, subscriptionId, onPlanUpdateSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pricingType, setPricingType] = useState(parentPricingType || 'monthly');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Get updated data from Context
    const { status: subscriptionStatus, currentPlan, planCycle, subscriptionEndDate, subscriptionId: contextSubscriptionId,refreshSubscription } = useSubscription();
    
    const effectiveSubscriptionId = subscriptionId || contextSubscriptionId;
        
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setActiveTab('current');
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [success, setActiveTab]);

    // Set current users current plan on main dropdown
    useEffect(() => {
        if (isResubscribe || subscriptionStatus === 'canceling') {
            const plan = PricingPlans.find(plan => plan.title === currentPlan);
            if (plan) {
                setSelectedPlan(plan);
            }
        }
    }, [isResubscribe, currentPlan, subscriptionStatus]);

    // Set plan cycle type
    useEffect(() => {
        if ((isResubscribe || subscriptionStatus === 'canceling') && planCycle) {
            const cycleType = planCycle === 'yearly' ? 'yearly' : 'monthly';
            setPricingType(cycleType);
            if (setParentPricingType) {
                setParentPricingType(cycleType);
            }
        }
    }, [isResubscribe, subscriptionStatus, planCycle, setParentPricingType]);

    // Subscription handling
    const handleSubscription = async () => {
        if (!isResubscribe && !selectedPlan) return;
        
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            if (isResubscribe) {
                if (!effectiveSubscriptionId) {
                    setError('No subscription found to reactivate');
                    setIsLoading(false);
                    return;
                }
                
                try {
                    const result = await reactivateSubscription(effectiveSubscriptionId);
                    if (result && result.success) {
                        setSuccess('Your subscription has been reactivated');
                        
                        if (refreshSubscription) {
                            await refreshSubscription();
                        }
                        
                        if (onPlanUpdateSuccess) {
                            onPlanUpdateSuccess(currentPlan);
                        }
                    } else {
                        setError(result.error || 'Unable to reactivate subscription');
                    }
                } catch (error) {
                    console.error('Error reactivating subscription:', error);
                    setError('Unable to reactivate your subscription. Please try again later.');
                }
            } else {
                const priceId = pricingType === 'monthly' 
                    ? selectedPlan.priceIdMonthly 
                    : selectedPlan.priceIdYearly;
                
                await createCheckoutSession(priceId);
            }
        } catch (error) {
            console.error('Error in subscription process:', error);
            setError('Payment cannot be processed. Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle price change (Monthly / Yearly)
    const handlePricingTypeChange = (type) => {
        setPricingType(type);
        if (setParentPricingType) {
            setParentPricingType(type);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Close Dropdown menu when user select plan
    const selectPlan = (plan) => {
        setSelectedPlan(plan);
        setIsOpen(false);
    };

    // Check if a plan is the user's current plan
    const isCurrentPlan = (planTitle) => {
        
        return (subscriptionStatus === 'active' || subscriptionStatus === 'canceling') && 
               currentPlan === planTitle && 
               planCycle === pricingType;
    };
    
    const getCurrentPlan = () => {
        return PricingPlans.find(plan => plan.title === currentPlan);
    };
    
    const displayPlan = selectedPlan || (currentPlan ? getCurrentPlan() : null);

    // Resubscribe section
    if (isResubscribe) {
        return (
            <div className="space-y-2">
                <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                    <div className="p-3 sm:p-4 border border-gray-800 rounded-lg mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">
                                    Reactivate Subscription
                                </h4>
                            </div>
                        </div>
                        
                        <div className="mt-4 rounded-lg">
                            <p className="px-6 text-sm text-gray-300">
                                Reactivating your <span className="text-indigo-300 font-semibold">{currentPlan}</span> ({planCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                            </p>
                            <p className="px-10 text-sm text-gray-500 mt-2">
                                Nothing will be charged. Your subscription plan will end on {subscriptionEndDate}
                            </p>
                            
                            {/* Success and Error message section */}
                            <div className='py-4'>
                                {error && (
                                    <div className="bg-transparent p-3 rounded-lg border border-gray-800 text-white text-sm mb-4">
                                        {error}
                                    </div>
                                )}
                                
                                {success && !error && (
                                    <div className="bg-transparent p-3 rounded-lg border border-gray-800 text-white text-sm mb-4">
                                        {success}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                
                    <div className="flex gap-3 justify-end">
                        <Button
                            onClick={() => setActiveTab('current')}
                            className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                            >
                            Back
                        </Button>
                        
                        <Button
                            onClick={handleSubscription}
                            disabled={isLoading}
                            className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                            >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                                    Reactivating subscription...
                                </span>
                            ) : 'Reactivate Subscription'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Pricing Plan section (Change Plan option)
    return (
        <div className="space-y-2">
            <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                <div className="p-3 sm:p-4 border border-gray-800 rounded-lg mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">
                                Pricing Plans
                            </h4>
                        </div>
                        <div className="flex border border-gray-800 p-1 rounded-lg self-start">
                            <button
                                className={`px-3 py-1 text-sm rounded-md transition-all ${
                                    pricingType === 'monthly'
                                    ? 'bg-gray-600 text-white' 
                                    : 'bg-transparent text-gray-400 hover:text-white'
                                }`}
                                onClick={() => handlePricingTypeChange('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                className={`px-3 py-1 text-sm rounded-md transition-all ${
                                    pricingType === 'yearly'
                                    ? 'bg-gray-600 text-white' 
                                    : 'bg-transparent text-gray-400 hover:text-white'
                                }`}
                                onClick={() => handlePricingTypeChange('yearly')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>

                    {/* Success and Error message section */}
                    {error && (
                        <div className="bg-transparent p-3 rounded-lg border border-gray-800 text-white text-sm mb-4">
                            {error}
                        </div>
                    )}
                    
                    {success && !error && (
                        <div className="bg-transparent p-3 rounded-lg border border-gray-800 text-white text-sm mb-4">
                            {success}
                        </div>
                    )}
                    
                    {/* Toggle dropdown menu with plans */}
                    <div className="relative w-full py-4">
                        <button
                            onClick={toggleDropdown}
                            className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-800 text-white mb-4 text-sm"
                        >
                            <span>{displayPlan ? displayPlan.title : "Select a Plan"}</span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isOpen && (
                            <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                                <ul className="py-0">
                                    {PricingPlans.map((plan) => {
                                        const isPlanCurrent = (subscriptionStatus === 'active' || subscriptionStatus === 'canceling') && currentPlan === plan.title && planCycle === pricingType;

                                        return (
                                            <li key={plan.title} className="px-4 py-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-0">
                                                <button 
                                                    className="w-full text-left text-gray-300"
                                                    onClick={() => selectPlan(plan)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{plan.title}</span>
                                                        <span className="text-sm text-gray-300">
                                                            ${pricingType === 'monthly' ? plan.priceMonthly : plan.priceYearly}/{pricingType === 'monthly' ? 'mo' : 'yr'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {plan.features[pricingType][2]}
                                                    </p>
                                                    {isPlanCurrent && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-800 text-indigo-400 text-xs rounded-full">
                                                            {subscriptionStatus === 'canceling' ? 'Current Plan (Canceling)' : 'Current Plan'}
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                        <p className='py-4 px-4 text-sm text-gray-600'> Changing to a new plan will replace your previous subscription plan. The remaining credits from the previous plan will be added on with your new plan credits and be available to use.</p>
                    </div>
                </div>
            
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={() => setActiveTab('current')}
                        className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                        >
                        Back
                    </Button>
                    <Button
                        onClick={handleSubscription}
                        disabled={!selectedPlan || (selectedPlan && isCurrentPlan(selectedPlan.title) && subscriptionStatus !== 'canceling') || isLoading}
                        className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                        >
                        {isLoading ? (
                            <span className="flex items-center">
                                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                                Redirecting to payment...
                            </span>
                        ) : (
                            selectedPlan && isCurrentPlan(selectedPlan.title) 
                                ? subscriptionStatus === 'canceling' ? 'Reactivate' : 'Current Plan' 
                                : 'Subscribe'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};