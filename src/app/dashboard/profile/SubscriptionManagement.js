import { useState, useEffect } from 'react';
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { useSubscription } from '@/context/subscriptionContext';
import { Cancel } from './Cancel';
import { PriceDropDownMenu } from './PriceDropDownMenu';
import { Credits } from './BuyCredits'

export default function SubscriptionManagement({ onClose }) {
    const [activeTab, setActiveTab] = useState('current');
    const [pricingType, setPricingType] = useState('monthly');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isResubscribe, setIsResubscribe] = useState(false);
    
    // Get updated data from Context
    const { status: subscriptionStatus, currentPlan, subscriptionId, cancelationDate, loading, subscriptionEndDate, freeTrialTokens, updateTokenCount, refreshSubscription } = useSubscription();

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (success && success.toLowerCase().includes('cancel')) {
            const timer = setTimeout(async () => {
                if (refreshSubscription) {
                    try {
                        await refreshSubscription();
                    } catch (error) {
                        console.error("Error refreshing subscription data:", error);
                        setError("Failed to refresh subscription data");
                    }
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [success, refreshSubscription]);

    const handleResubscribe = () => {
        setIsResubscribe(true);
        setActiveTab('change');
    };

    const handleChangePlan = () => {
        setIsResubscribe(false);
        setActiveTab('change');
    };
  
    // Check if canceled subscription is expired
    const hasExpired = subscriptionStatus === 'canceling' && new Date() > new Date(cancelationDate);

    // Update new plan subscription
    const handlePlanUpdateSuccess = async (newTokens) => {
        if (refreshSubscription) {
            try {
                await refreshSubscription();
            } catch (error) {
                console.error("Error refreshing subscription data:", error);
                setError("Failed to refresh subscription data after plan update.");
                return;
            }
        }
       
        setActiveTab('current');
    };
  
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-[#0D161F] border border-gray-800 rounded-lg w-full max-w-4xl m-4">
                <div className="border-b border-gray-800 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        {activeTab === 'current' ? 'Subscription Management' : 
                         activeTab === 'change' && isResubscribe ? 'Resubscribe' :
                         activeTab === 'change' ? 'Pricing Plan' :
                         activeTab === 'cancel' ? 'Cancel Subscription' : 'Subscription Management'}
                    </h2>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-gray-900"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            
                <div className="flex h-[600px]">
                    <div className="flex-1 p-6 overflow-y-auto">

                        {/* Success and Error message section */}
                        {success && (
                            <div className="p-4 mb-4 rounded-lg  border border-gray-700 text-white flex items-center">
                                {success}
                            </div>
                        )}
                
                        {error && (
                            <div className="p-4 mb-4 rounded-lg border border-gray-700 text-white">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-800"></div>
                            </div>
                        ) : (
                        <>
                            {activeTab === 'current' && (
                                <div className="space-y-6">     
                                {/* Free Trial Section */}
                                {freeTrialTokens > 0 && (
                                 <div className="border border-gray-400 p-2 rounded-lg shadow-xl">
                                    <div className="p-3 sm:p-4 rounded-lg">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">Free Trial Activated</h4>
                                            </div>
                                        </div>
                                        <h4 className="text-sm px-2 sm:px-4 text-gray-400 mt-2">
                                            Your free trial includes 50 credits and you have used {freeTrialTokens} credits.
                                        </h4>
                                    </div>
                                </div>
                            )}

                                    {/* Active Subscription */}
                                    {subscriptionStatus === 'active' ? (
                                    <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                                        <div className="p-3 sm:p-4 rounded-lg mb-6 border border-gray-800">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">{currentPlan}</h4>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-sm border border-gray-700 self-start sm:self-auto text-white">
                                                    Active
                                                </div>
                                            </div>
                                            <h4 className="text-sm px-2 sm:px-4 text-gray-400 mt-2">Next Payment: {subscriptionEndDate}</h4>
                                        </div>

                                        {/* Buttons to change or cancel subscription */}
                                        <div className="flex flex-wrap gap-4">
                                            <Button
                                                onClick={handleChangePlan}
                                                className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                            >
                                                Change Plan
                                            </Button>
                                            
                                            <Button
                                                onClick={() => setActiveTab('cancel')}
                                                className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                            >
                                                Cancel Subscription
                                            </Button>
                                            <Button
                                                onClick={() => setActiveTab('credit')}
                                                className="bg-transparent hover:bg-gray-800 text-white border border-gray-700 self-start sm:self-auto"
                                            >
                                                Buy credits
                                            </Button>
                                        </div>
                                    </div>

                                    //  Canceling subscription
                                    ) : subscriptionStatus === 'canceling' && !hasExpired ? (
                                    <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                                        <div className="p-3 sm:p-4 border border-gray-800 rounded-lg mb-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">{currentPlan}</h4>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-sm border border-gray-700 self-start sm:self-auto text-white">
                                                    Canceling
                                                </div>
                                            </div>
                                            <h4 className="text-sm px-2 sm:px-4 text-gray-400 mt-2">Your plan will end on: {subscriptionEndDate || (cancelationDate && new Date(cancelationDate).toLocaleDateString())}</h4>                   
                                        </div>

                                        {/* Buttons to Resubscribe or change subscription */}
                                        <div className="space-y-6">
                                            <div className="flex flex-wrap gap-4">
                                                <Button
                                                    onClick={handleResubscribe}
                                                    className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                                >
                                                    Resubscribe
                                                </Button>
                                                
                                                <Button
                                                    onClick={handleChangePlan}
                                                    className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                                >
                                                    Change Plan
                                                </Button>
                                                <Button
                                                    onClick={() => setActiveTab('credit')}
                                                    className="bg-transparent hover:bg-gray-800 text-white border border-gray-700 self-start sm:self-auto"
                                                >
                                                    Buy credits
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    ) : (

                                    // Inactive subscription
                                    <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                                        <div className="p-3 sm:p-4 bg-gray-800 rounded-lg mb-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">No Active Subscription</h4>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-sm border border-gray-700 self-start sm:self-auto text-white">
                                                    Inactive
                                                </div>
                                            </div>
                                            <h4 className="text-sm px-2 sm:px-4 text-gray-400 mt-2">You are currently not subscribed</h4>
                                        </div>
                                        
                                        {/* Buttons to view subscription plans */}
                                        <div className="flex flex-wrap gap-4">
                                            <Button
                                                onClick={handleChangePlan}
                                                className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                                                >
                                                View Pricing Plans
                                            </Button>
                                        </div>
                                    </div>
                                    )}  
                                </div>
                            )}
                                
                            {/* Pricing Drop down */}
                            {activeTab === 'change' && (
                                <PriceDropDownMenu 
                                    setActiveTab={setActiveTab}
                                    pricingType={pricingType}
                                    setPricingType={setPricingType}
                                    isResubscribe={isResubscribe}
                                    subscriptionId={subscriptionId}
                                    onPlanUpdateSuccess={handlePlanUpdateSuccess}
                                />
                            )}
                                
                            {/* cancel subscription */}
                            {activeTab === 'cancel' && (
                                <Cancel 
                                    onClose={() => setActiveTab('current')} 
                                    setActiveTab={setActiveTab}
                                    setSuccess={setSuccess}
                                />
                            )}
                              {activeTab === 'credit' && (
                                <Credits 
                                    onClose={() => setActiveTab('current')} 
                                    setActiveTab={setActiveTab}
                                />
                            )}
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}