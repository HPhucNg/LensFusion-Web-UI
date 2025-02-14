"use client"
import React, { useState, useEffect } from 'react'
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { auth } from '@/firebase/FirebaseConfig'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/context/subscriptionContext'
import { createCreditCheckout } from '../../../../../stripe/createCheckoutSession'

//this page handles the credit payments

function Credits() {
  const [tokens, setTokens] = useState(300)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { tokens: currentTokens } = useSubscription()
  const pricePerToken = 0.05

  //check user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  //shadcn component (slider) - updates the token amount
  const handleSliderChange = (value) => {
    setTokens(value[0])
  }

  // handles purchasing the credits
  const handlePurchase = async () => {
    try {
      if (tokens === 0) {
        alert('Select valid number of credits');
        return;
      }
      await createCreditCheckout(tokens, pricePerToken);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Unable to process purchase. Please try again');
    }
  };

  //show card that prompts user to log in before purchasing credits
  if (!loading && !user) {
    return (
      <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
        <Navbar />
        <div className="container mx-auto py-10">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="mb-4">Please log in or register to purchase credits</p>
              <Button onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden'>
      <Navbar />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Buy Credits</h1>
        
        {/* Purchase Credit card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Select Amount to Purchase</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Current balance: {currentTokens} tokens
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Minimum</span>
                <span className="text-sm text-gray-500">Maximum</span>
              </div>
              
              <Slider
                defaultValue={[300]}
                max={1000}
                min={0}
                step={10}
                onValueChange={handleSliderChange}
                className="w-full"
              />

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">0 Token</span>
                <span className="text-sm text-gray-500">1000 Token</span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Selected: {tokens} tokens
                </div>
                <div className="text-lg font-semibold">
                  ${(tokens * pricePerToken).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full" disabled={tokens === 0} onClick={handlePurchase}>
              Purchase {tokens} tokens for ${(tokens * pricePerToken).toFixed(2)}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

export default Credits