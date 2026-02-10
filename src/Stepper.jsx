import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Stepper.css';

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="stepper-outer-container" {...rest}>
      <div className={`stepper-glass-card ${stepCircleContainerClassName}`}>
        
        {/* Step Indicators */}
        <div className={`stepper-indicator-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                <StepIndicator
                  step={stepNumber}
                  disableStepIndicators={disableStepIndicators}
                  currentStep={currentStep}
                  onClickStep={(clicked) => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    updateStep(clicked);
                  }}
                />
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Animated Content Area */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`stepper-content-area ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* Navigation Footer */}
        {!isCompleted && (
          <div className={`stepper-footer ${footerClassName}`}>
            <div className={`stepper-nav-btns ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
              {currentStep !== 1 && (
                <button onClick={handleBack} className="stepper-btn-back" {...backButtonProps}>
                  {backButtonText}
                </button>
              )}
              <button 
                onClick={isLastStep ? handleComplete : handleNext} 
                className="stepper-btn-next" 
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Internal Helper Components **/

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }) {
  const [parentHeight, setParentHeight] = useState(0);
  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (dir) => ({ x: dir >= 0 ? '50%' : '-50%', opacity: 0 }),
              center: { x: '0%', opacity: 1 },
              exit: (dir) => ({ x: dir >= 0 ? '-50%' : '50%', opacity: 0 })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onUpdate={(latest) => {
               const el = document.getElementById(`step-content-${currentStep}`);
               if (el) setParentHeight(el.offsetHeight);
            }}
            style={{ position: 'absolute', width: '100%' }}
          >
            <div id={`step-content-${currentStep}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';
  return (
    <motion.div 
      onClick={() => !disableStepIndicators && onClickStep(step)} 
      className={`stepper-dot ${status}`}
    >
      {status === 'complete' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : <span>{step}</span>}
    </motion.div>
  );
}

function StepConnector({ isComplete }) {
  return (
    <div className="stepper-line">
      <motion.div 
        className="stepper-line-progress"
        initial={{ width: "0%" }}
        animate={{ width: isComplete ? "100%" : "0%" }}
      />
    </div>
  );
}

export function Step({ children }) {
  return <div className="py-4">{children}</div>;
}