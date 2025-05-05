import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { createCreditCheckout } from '../../../../stripe/createCheckoutSession';
import { useSubscription } from '@/context/subscriptionContext';

export const Credits = ({ setActiveTab }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(null);
    
    // Get updated data from Context
    const { tokens: currentTokens } = useSubscription();
    
    // Price for each credits
    const packages = {
        low: [
            { tokens: 15, price: 1.99 },
            { tokens: 25, price: 3.05 },
            { tokens: 35, price: 4.08 },
            { tokens: 50, price: 5.99 }
        ],
        medium: [
            { tokens: 75, price: 7.15 },
            { tokens: 100, price: 9.99 },
            { tokens: 125, price: 11.99 }
        ],
        high: [
            { tokens: 175, price: 17.99},
            { tokens: 250, price: 25.99},
            { tokens: 500, price: 45.25}
        ]
    };

    // Purchase credits
    const handlePurchase = async (packageData) => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        setSelectedPackage(packageData);
        
        try {
            await createCreditCheckout(packageData.tokens, packageData.price / packageData.tokens);
            
            setSuccess('Redirecting to checkout...');
        } catch (error) {
            console.error('Purchase failed:', error);
            setError('Unable to process purchase. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Buy credits */}
            <div className="border border-gray-700 p-4 sm:p-8 rounded-lg shadow-xl">
                <div className="p-3 sm:p-4 border border-gray-800 rounded-lg mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h4 className="text-xl sm:text-2xl font-semibold gradient-plan-text select-none">Buy Credits</h4>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium border-2 border-gray-700 text-white self-start sm:self-auto">
                            {currentTokens} Credits
                        </div>
                    </div> 

                    {/* Row 1 */}
                    <div className="p-2 sm:p-4 rounded-lg mb-6 space-y-6">
                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {packages.low.map((pkg) => (
                                    <button
                                        key={pkg.tokens}
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={isLoading}
                                        className={`p-4 rounded-lg border py-3 border-gray-700 hover:border-red-300 text-center transition-colors ${
                                            selectedPackage?.tokens === pkg.tokens ? 'border-red-300' : ''
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="text-xl font-bold text-red-200">{pkg.tokens}</div>
                                        <div className="text-white font-semibold">${pkg.price.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">${(pkg.price / pkg.tokens).toFixed(2)} per credit</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div>
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                                {packages.medium.map((pkg) => (
                                    <button
                                        key={pkg.tokens}
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={isLoading}
                                        className={`p-4 rounded-lg border border-gray-700 hover:border-purple-300 text-center transition-colors relative ${
                                            selectedPackage?.tokens === pkg.tokens ? 'border-purple-300' : ''
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="text-xl font-bold text-purple-300">{pkg.tokens}</div>
                                        <div className="text-white font-semibold">${pkg.price.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">${(pkg.price / pkg.tokens).toFixed(2)} per credit</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div>
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                                {packages.high.map((pkg) => (
                                    <button
                                        key={pkg.tokens}
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={isLoading}
                                        className={`p-4 rounded-lg border border-gray-700 hover:border-blue-300 text-center transition-colors relative ${
                                            selectedPackage?.tokens === pkg.tokens ? 'border-blue-300' : ''
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                       
                                        <div className="text-xl font-bold text-blue-300">{pkg.tokens}</div>
                                        <div className="text-white font-semibold">${pkg.price.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">${(pkg.price / pkg.tokens).toFixed(2)} per credit</div>
                                        
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <div className="text-sm text-gray-400 space-y-1">
                                <ul className="text-sm text-gray-500 space-y-2">
                                    <li>All Credit purchases are added to your current credit balance and note buy credit is only available for subscribed users</li>
                                </ul>
                            </div>
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

                {/* Back Button */}
                <div className="flex gap-3 justify-end">
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