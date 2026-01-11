import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosConfig';
import OnboardingStep1 from '../components/Onboarding/OnboardingStep1';
import OnboardingStep2 from '../components/Onboarding/OnboardingStep2';
import OnboardingStep3 from '../components/Onboarding/OnboardingStep3';
import OnboardingStep4 from '../components/Onboarding/OnboardingStep4';
import OnboardingStep5 from '../components/Onboarding/OnboardingStep5';
import OnboardingSummary from '../components/Onboarding/OnboardingSummary';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, fetchUserInfo } = useAuth();

  const totalSteps = 6; // 5 steps + 1 summary

  const handleNext = (data) => {
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = (data) => {
    // User skipped mini-game, go to summary
    const newFormData = { ...formData, ...data };
    setFormData(newFormData);
    setCurrentStep(6); // Go to summary
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitOnboarding = async (data) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Map frontend data structure to backend expected format
      const payload = {
        goal: data.goal,
        current_level: data.background, // Map background -> current_level
        focus_skills: data.painPoint ? [data.painPoint] : [], // Map painPoint -> focus_skills array
        study_hours_per_week: data.timeCommitment ? parseInt(data.timeCommitment.split('-')[0]) : null, // Extract hours
        target_band: null, // Optional
        preferred_study_days: [], // Optional
        exam_date: null, // Optional
      };

      console.log('📤 Submitting onboarding:', payload);
      const response = await axiosInstance.post('/onboarding', payload);
      console.log('✅ Onboarding response:', response.data);
      
      console.log('🔄 Fetching updated user info...');
      await fetchUserInfo(); // Reload user data to update onboarding status
      console.log('✅ User info updated:', user);
      
      console.log('➡️ Navigating to dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('❌ Error submitting onboarding:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 onNext={handleNext} />;
      case 2:
        return <OnboardingStep2 onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <OnboardingStep3 onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <OnboardingStep4 onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <OnboardingStep5 onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />;
      case 6:
        // Submit data when reaching summary
        if (!isSubmitting && Object.keys(formData).length > 0) {
          submitOnboarding(formData);
        }
        return <OnboardingSummary data={formData} userName={user?.username || 'bạn'} />;
      default:
        return <OnboardingStep1 onNext={handleNext} />;
    }
  };

  // Calculate progress percentage
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-purple-100 backdrop-blur-sm z-50 shadow-sm">
        <div
          className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Indicator */}
      {currentStep < 6 && (
        <div className="fixed top-6 right-6 z-40">
          <div className="bg-white backdrop-blur-sm rounded-full px-5 py-2.5 shadow-lg border-2 border-purple-100">
            <span className="text-gray-700 text-sm font-bold">
              Bước {currentStep}/5
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pt-8">
        {renderStep()}
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white backdrop-blur-md rounded-2xl p-10 border-2 border-purple-100 shadow-2xl">
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 border-4 border-[#6C5CE7] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-800 text-lg font-semibold">
                Đang lưu lộ trình của bạn...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
