

import React from 'react';
import { AppStep } from '../types';
import { Package, Edit3, Database, MessageSquareText, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  currentStep: AppStep;
  onStepClick: (step: AppStep) => void;
  enabledSteps?: AppStep[];
}

const steps = [
  { id: AppStep.INPUT, label: '1. THE CONCEPT', subLabel: '核心需求', icon: Edit3 },
  { id: AppStep.SCRIPT, label: '2. THE SCRIPT', subLabel: '创作剧本', icon: MessageSquareText },
  { id: AppStep.VIDEO_GENERATION, label: '3. VIDEO GENERATION', subLabel: '视频生成', icon: Package },
];

const StepIndicator: React.FC<Props> = ({ currentStep, onStepClick, enabledSteps }) => {
  const currentIdx = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-7xl mx-auto mb-10 px-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative bg-white border-2 border-black p-4 md:p-2 md:rounded-full">
        {steps.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isCompleted = idx < currentIdx;
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;

          const isEnabled = enabledSteps 
              ? enabledSteps.includes(step.id) 
              : (idx <= currentIdx);

          return (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => onStepClick(step.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-full transition-all focus:outline-none relative group",
                  isActive 
                    ? "bg-[#FACC15] text-black border-2 border-black transform" 
                    : isEnabled
                        ? "bg-white text-black hover:bg-gray-100 cursor-pointer border-2 border-transparent"
                        : "bg-transparent text-gray-400 cursor-not-allowed border-2 border-transparent"
                )}
                disabled={!isEnabled && !isActive}
              >
                 <div className={clsx(
                     "w-10 h-10 rounded-full flex items-center justify-center border-2 border-black shrink-0",
                     isActive ? "bg-white text-black" : isEnabled ? "bg-black text-white" : "bg-gray-200 border-gray-400 text-gray-400"
                 )}>
                    <Icon size={20} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col items-start justify-center h-full">
                     <span className={clsx("font-bangers text-xl leading-none tracking-wide", isActive ? "text-black" : isEnabled ? "text-black" : "text-gray-400")}>
                         {step.label}
                     </span>
                     <span className={clsx("text-lg font-normal font-sans", isActive ? "text-black/70" : "text-gray-400")}>
                         {step.subLabel}
                     </span>
                 </div>
              </button>
              
              {!isLast && (
                <div className="hidden md:flex text-black">
                    <ChevronRight size={24} strokeWidth={3} className="opacity-20" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
