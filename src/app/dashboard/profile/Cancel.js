import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useSubscription } from '@/context/subscriptionContext';
import { cancelSubscription } from '../../../../stripe/createCheckoutSession';

export const Cancel = ({ setActiveTab, setSuccess: setParentSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Get updated data from Context
    const { status: subscriptionStatus, currentPlan, subscriptionId, subscriptionEndDate } = useSubscription();

    // Cancel Subscription
    const handleCancelSubscription = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await cancelSubscription(subscriptionId);
            
            if (result) {                
                setTimeout(() => {
                    setActiveTab('current');
                }, 1500);
            } else {
                setError('Cancelation failed. Please try again later');
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            setError('Cancelation failed. Please try again later');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Cancel active subscription */}
            <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                <div className="p-3 sm:p-4 border border-gray-800 rounded-lg mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">Cancel Subscription</h4>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium border-2 border-gray-700 text-white self-start sm:self-auto">
                            {currentPlan}
                        </div>
                    </div> 

                    {/* Message area */}
                    <div className="p-2 sm:p-4 rounded-lg mb-6">
                        <h3 className="font-medium text-gray-400 mb-3">Confirm your cancelation</h3>
                        <div className="px-2 sm:px-6">
                            <ul className="text-sm text-gray-500 space-y-2">
                                <li>Your subscription plan will be active until {subscriptionEndDate}</li>
                                <li>You will lose all access to our AI features when your subscription ends</li>
                                <li>You will loose access to purchasing credits</li>
                                <li>At the end of your subscription date on {subscriptionEndDate}, your credits will be locked for 60 days. If you renew within that time, your credits will be restored and new plan credits will be added. If not, the unused credits will be permanently deleted</li>
                                <li>Resubscribe to your plan anytime within the time of your subscription date</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Success and Error message section */}
                {success && !error && (
                    <div className="p-4 mb-4 rounded-lg border border-gray-700 text-white flex items-center">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="p-4 mb-4 rounded-lg border border-gray-700 text-white">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={handleCancelSubscription}
                        className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Canceling, please wait...' : 'Confirm Cancelation'}
                    </Button>
                    <Button
                        onClick={() => setActiveTab('current')}
                        className="bg-transparent hover:bg-gray-800 text-white border border-gray-700"
                        disabled={isLoading}
                    >
                        Back
                    </Button>
                </div>
            </div>
        </div>
    );
}