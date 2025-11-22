'use client';

interface FlowchartStep {
  stepNumber: number;
  title: string;
  userPays: string;
  details: string;
}

interface FlowchartScenarioProps {
  scenario: string;
  steps: FlowchartStep[];
  totalCost: string;
  explanation: string;
}

export default function FlowchartScenario({ scenario, steps, totalCost, explanation }: FlowchartScenarioProps) {
  return (
    <div className="my-8">
      <div className="mb-6">
        <p className="text-gray-700 text-lg">{scenario}</p>
      </div>
      
      <div className="flex flex-col space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Step Box */}
            <div className="bg-white border-2 border-blue-200 rounded-lg p-6 w-full max-w-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {step.stepNumber}
                </div>
                <h3 className="ml-3 font-semibold text-gray-800 text-lg">{step.title}</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-red-600 font-semibold">You pay:</span>
                  <span className="ml-2 text-gray-700">{step.userPays}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 font-semibold">Insurance:</span>
                  <span className="ml-2 text-gray-700">{step.details}</span>
                </div>
              </div>
            </div>
            
            {/* Arrow (except for last step) */}
            {index < steps.length - 1 && (
              <div className="my-4">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-blue-400"></div>
              </div>
            )}
          </div>
        ))}
        
        {/* Total Cost Box */}
        <div className="flex flex-col items-center mt-6">
          <div className="my-4">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-green-500"></div>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 w-full max-w-lg shadow-md">
            <div className="text-center">
              <h3 className="font-bold text-green-800 text-xl mb-2">Total Cost</h3>
              <p className="text-green-700 font-semibold text-lg">{totalCost}</p>
              <p className="text-gray-600 mt-3 text-sm">{explanation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}