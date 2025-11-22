export interface BenchmarkCriteria {
  excellent: { min?: number; max?: number; value?: string[] };
  good: { min?: number; max?: number; value?: string[] };
  average: { min?: number; max?: number; value?: string[] };
  below: { min?: number; max?: number; value?: string[] };
  expensive?: { min?: number; max?: number; value?: string[] };
  poor?: { min?: number; max?: number; value?: string[] };
}

export type PlanType = 'individual' | 'small-group' | 'large-employer' | 'medicare-advantage';

export const PLAN_BENCHMARKS: Record<PlanType, Record<string, BenchmarkCriteria>> = {
  'individual': {
    'monthly-premium': {
      excellent: { max: 400 },
      good: { min: 401, max: 500 },
      average: { min: 501, max: 600 },
      below: { min: 601, max: 700 },
      expensive: { min: 701 }
    },
    'total-risk': {
      excellent: { value: ['Ded ≤ $3,000 + OOP max ≤ $8,000'] },
      good: { value: ['Ded ≤ $5,000 + OOP max ≤ $9,000'] },
      average: { value: ['Avg range'] },
      below: { value: ['High deductible or OOP max'] },
      expensive: { value: ['Ded ≥ $6,000 + OOP max ≥ $10,000'] }
    },
    'network': {
      excellent: { value: ['Broad national PPO'] },
      good: { value: ['Large regional PPO/EPO'] },
      average: { value: ['Medium regional'] },
      below: { value: ['Narrow EPO/HMO'] },
      expensive: { value: ['Very narrow / closed'] }
    },
    'rx-costs': {
      excellent: { value: ['Generic ≤ $10, specialty ≤ 25%'] },
      good: { value: ['Generic ≤ $15, specialty ≤ 30%'] },
      average: { value: ['Generic $15–$25, specialty 30–40%'] },
      below: { value: ['High tier-3/4 copays'] },
      expensive: { value: ['40–50% specialty'] }
    },
    'oop-max': {
      excellent: { max: 7000 },
      good: { min: 7001, max: 8500 },
      average: { min: 8501, max: 9450 },
      below: { min: 9451 }
    },
    'doctor-visits': {
      excellent: { value: ['≤ $25 prim / ≤ $50 spec'] },
      good: { value: ['≤ $35 / ≤ $70'] },
      average: { value: ['≤ $50 / ≤ $100'] },
      below: { value: ['After deductible only'] },
      expensive: { value: ['Full cost until deductible'] }
    },
    'referrals': {
      excellent: { value: ['No referral needed'] },
      good: { value: ['No referral needed'] },
      average: { value: ['No referral needed'] },
      below: { value: ['No referral needed'] },
      expensive: { value: ['Referral required'] }
    },
    'er-cost': {
      excellent: { max: 300 },
      good: { min: 301, max: 500 },
      average: { min: 501, max: 750 },
      below: { min: 751 },
      expensive: { value: ['After deductible'] }
    },
    'kids-dental-vision': {
      excellent: { value: ['100% preventive + basic'] },
      good: { value: ['Preventive only'] },
      average: { value: ['Limited copays'] },
      below: { value: ['Limited copays'] },
      expensive: { value: ['Not included (illegal in ACA)'] }
    },
    'adult-dental-vision': {
      excellent: { value: ['Bundled or rich rider'] },
      good: { value: ['Limited rider available'] },
      average: { value: ['Separate policy needed (normal)'] },
      below: { value: ['Separate policy needed (normal)'] },
      expensive: { value: ['None'] }
    }
  },

  'small-group': {
    'monthly-premium': {
      excellent: { max: 150 },
      good: { min: 151, max: 250 },
      average: { min: 251, max: 400 },
      below: { min: 401, max: 550 },
      expensive: { min: 551 }
    },
    'total-risk': {
      excellent: { value: ['Ded ≤ $2,000 + OOP ≤ $6,000'] },
      good: { value: ['Ded ≤ $3,000 + OOP ≤ $8,000'] },
      average: { value: ['Avg range'] },
      below: { value: ['High ded or OOP'] },
      expensive: { value: ['Ded ≥ $5,000 + OOP ≥ $9,000'] }
    },
    'network': {
      excellent: { value: ['Broad PPO'] },
      good: { value: ['Regional PPO/EPO'] },
      average: { value: ['Narrow EPO/HMO'] },
      below: { value: ['Very narrow'] },
      expensive: { value: ['Very narrow'] }
    },
    'rx-costs': {
      excellent: { value: ['Generic ≤ $10, specialty ≤ 25%'] },
      good: { value: ['Generic ≤ $15, specialty ≤ 30%'] },
      average: { value: ['Generic $15–$25, specialty 30–40%'] },
      below: { value: ['High tier-3/4 copays'] },
      expensive: { value: ['40–50% specialty'] }
    },
    'oop-max': {
      excellent: { max: 5000 },
      good: { min: 5001, max: 7000 },
      average: { min: 7001, max: 8500 },
      below: { min: 8501, max: 9500 },
      expensive: { min: 9501 }
    },
    'doctor-visits': {
      excellent: { value: ['$0–$20 prim / $0–$40 spec'] },
      good: { value: ['$20–$30 / $40–$60'] },
      average: { value: ['$30–$50 / $60–$80'] },
      below: { value: ['After deductible'] },
      expensive: { value: ['Full cost until deductible'] }
    },
    'referrals': {
      excellent: { value: ['No referral needed'] },
      good: { value: ['No referral needed'] },
      average: { value: ['Some referrals required'] },
      below: { value: ['Most referrals required'] },
      expensive: { value: ['All referrals required'] }
    },
    'er-cost': {
      excellent: { max: 200 },
      good: { min: 201, max: 350 },
      average: { min: 351, max: 500 },
      below: { min: 501, max: 750 },
      expensive: { min: 751 }
    },
    'kids-dental-vision': {
      excellent: { value: ['100% preventive + basic'] },
      good: { value: ['Preventive only'] },
      average: { value: ['Limited copays'] },
      below: { value: ['Limited copays'] },
      expensive: { value: ['Very limited or none'] }
    },
    'adult-dental-vision': {
      excellent: { value: ['Fully or partially bundled'] },
      good: { value: ['Rich rider'] },
      average: { value: ['Basic rider'] },
      below: { value: ['Separate only'] },
      expensive: { value: ['None'] }
    }
  },

  'large-employer': {
    'monthly-premium': {
      excellent: { min: 0, max: 100 },
      good: { min: 101, max: 200 },
      average: { min: 201, max: 350 },
      below: { min: 351, max: 500 },
      expensive: { min: 501 }
    },
    'total-risk': {
      excellent: { value: ['Ded ≤ $1,500 + OOP ≤ $4,000'] },
      good: { value: ['Ded ≤ $2,500 + OOP ≤ $6,000'] },
      average: { value: ['Avg range'] },
      below: { value: ['HDHP-style'] },
      expensive: { value: ['Ded ≥ $4,000 + OOP ≥ $8,000'] }
    },
    'network': {
      excellent: { value: ['National PPO'] },
      good: { value: ['Large regional PPO'] },
      average: { value: ['Medium regional'] },
      below: { value: ['Narrow'] },
      expensive: { value: ['Narrow'] }
    },
    'rx-costs': {
      excellent: { value: ['Generic ≤ $10, specialty ≤ 25%'] },
      good: { value: ['Generic ≤ $15, specialty ≤ 30%'] },
      average: { value: ['Generic $15–$25, specialty 30–40%'] },
      below: { value: ['High tier-3/4 copays'] },
      expensive: { value: ['40–50% specialty'] }
    },
    'oop-max': {
      excellent: { max: 4000 },
      good: { min: 4001, max: 6000 },
      average: { min: 6001, max: 8000 },
      below: { min: 8001, max: 10000 },
      expensive: { min: 10001 }
    },
    'doctor-visits': {
      excellent: { value: ['$0–$20 prim / $0–$40 spec'] },
      good: { value: ['$20–$30 / $40–$50'] },
      average: { value: ['$30–$50 / $50–$80'] },
      below: { value: ['After deductible common'] },
      expensive: { value: ['Full cost until deductible'] }
    },
    'referrals': {
      excellent: { value: ['No referral needed'] },
      good: { value: ['No referral needed'] },
      average: { value: ['Some referrals required'] },
      below: { value: ['Most referrals required'] },
      expensive: { value: ['All referrals required'] }
    },
    'er-cost': {
      excellent: { max: 150 },
      good: { min: 151, max: 250 },
      average: { min: 251, max: 400 },
      below: { min: 401, max: 600 },
      expensive: { min: 601 }
    },
    'kids-dental-vision': {
      excellent: { value: ['100% preventive + basic'] },
      good: { value: ['Preventive only'] },
      average: { value: ['Limited copays'] },
      below: { value: ['Limited copays'] },
      expensive: { value: ['Very limited or none'] }
    },
    'adult-dental-vision': {
      excellent: { value: ['Fully or partially included'] },
      good: { value: ['Rich rider included'] },
      average: { value: ['Basic rider'] },
      below: { value: ['Separate only'] },
      expensive: { value: ['None'] }
    }
  },

  'medicare-advantage': {
    'monthly-premium': {
      excellent: { value: ['$0'] },
      good: { min: 1, max: 25 },
      average: { min: 26, max: 70 },
      below: { min: 71, max: 120 },
      poor: { min: 121 }
    },
    'total-risk': {
      excellent: { value: ['Low deductible + Low MOOP'] },
      good: { value: ['Medium deductible + Low MOOP', 'Low deductible + Medium MOOP'] },
      average: { value: ['Medium deductible + Medium MOOP', 'High deductible + Low MOOP'] },
      below: { value: ['High deductible + Medium MOOP', 'Medium deductible + High MOOP'] },
      poor: { value: ['High deductible + High MOOP'] }
    },
    'network': {
      excellent: { value: ['Broad network'] },
      good: { value: ['Large regional'] },
      average: { value: ['Medium regional'] },
      below: { value: ['Narrow'] },
      poor: { value: ['Very narrow'] }
    },
    'rx-costs': {
      excellent: { value: ['Generic ≤ $5, brand ≤ $25'] },
      good: { value: ['Generic ≤ $10, brand ≤ $35'] },
      average: { value: ['Generic ≤ $15, brand ≤ $50'] },
      below: { value: ['Generic ≤ $20, brand ≤ $75'] },
      poor: { value: ['Generic ≥ $20, brand ≥ $75'] }
    },
    'oop-max': {
      excellent: { max: 3900 },
      good: { min: 4000, max: 5900 },
      average: { min: 6000, max: 7500 },
      below: { min: 7600, max: 8900 },
      poor: { min: 8901 }
    },
    'doctor-visits': {
      excellent: { value: ['$0–$10 prim / $0–$30 spec'] },
      good: { value: ['$10–$20 / $30–$45'] },
      average: { value: ['$20–$35 / $45–$60'] },
      below: { value: ['Higher'] },
      poor: { value: ['After deductible (rare)'] }
    },
    'referrals': {
      excellent: { value: ['No referral needed for most'] },
      good: { value: ['Some referrals required'] },
      average: { value: ['Referrals required for specialists'] },
      below: { value: ['Most referrals required'] },
      poor: { value: ['All referrals required'] }
    },
    'er-cost': {
      excellent: { max: 90 },
      good: { min: 91, max: 120 },
      average: { min: 121, max: 135 },
      below: { min: 136 },
      poor: { min: 136 }
    },
    'kids-dental-vision': {
      excellent: { value: ['N/A - Medicare population'] },
      good: { value: ['N/A - Medicare population'] },
      average: { value: ['N/A - Medicare population'] },
      below: { value: ['N/A - Medicare population'] },
      poor: { value: ['N/A - Medicare population'] }
    },
    'adult-dental-vision': {
      excellent: { value: ['Comprehensive included'] },
      good: { value: ['Good preventive + restorative'] },
      average: { value: ['Routine only'] },
      below: { value: ['Minimal or buy-up only'] },
      poor: { value: ['None'] }
    }
  }
};

export function detectPlanType(planText: string): PlanType {
  const text = planText.toLowerCase();
  
  if (text.includes('medicare advantage') || 
      text.includes('part c') || 
      text.includes('silversnickers') || 
      text.includes('star rating') || 
      text.includes('moop')) {
    return 'medicare-advantage';
  }
  
  if (text.includes('large group') || 
      text.includes('national network') || 
      text.includes('bluecard') || 
      text.includes('aso')) {
    return 'large-employer';
  }
  
  if (text.includes('small group') || 
      text.includes('2–50 employees') || 
      text.includes('2-50 employees') || 
      text.includes('shop')) {
    return 'small-group';
  }
  
  const premiumMatch = text.match(/premium.*?\$(\d+)/);
  if (premiumMatch && parseInt(premiumMatch[1]) < 200) {
    return 'large-employer';
  }
  
  return 'individual';
}

export function getBenchmarkRating(
  planType: PlanType, 
  metric: string, 
  value: number | string
): string {
  const benchmark = PLAN_BENCHMARKS[planType]?.[metric];
  if (!benchmark) return '❓';
  
  const ratings = planType === 'medicare-advantage' 
    ? ['▲▲▲▲▲', '▲▲▲▲□', '▲▲▲□□', '▲▲□□□', '▲□□□□']
    : ['▲▲▲▲▲', '▲▲▲▲□', '▲▲▲□□', '▲▲□□□', '▲□□□□'];
  
  if (typeof value === 'number') {
    if (benchmark.excellent?.max !== undefined && value <= benchmark.excellent.max) return ratings[0];
    if (benchmark.excellent?.min !== undefined && benchmark.excellent?.max !== undefined && 
        value >= benchmark.excellent.min && value <= benchmark.excellent.max) return ratings[0];
    
    if (benchmark.good?.max !== undefined && value <= benchmark.good.max && 
        value >= (benchmark.good.min || 0)) return ratings[1];
    
    if (benchmark.average?.max !== undefined && value <= benchmark.average.max && 
        value >= (benchmark.average.min || 0)) return ratings[2];
    
    if (benchmark.below?.max !== undefined && value <= benchmark.below.max && 
        value >= (benchmark.below.min || 0)) return ratings[3];
    
    return ratings[4];
  }
  
  if (typeof value === 'string') {
    const valueStr = value.toLowerCase();
    
    if (benchmark.excellent?.value?.some(v => valueStr.includes(v.toLowerCase()))) return ratings[0];
    if (benchmark.good?.value?.some(v => valueStr.includes(v.toLowerCase()))) return ratings[1];
    if (benchmark.average?.value?.some(v => valueStr.includes(v.toLowerCase()))) return ratings[2];
    if (benchmark.below?.value?.some(v => valueStr.includes(v.toLowerCase()))) return ratings[3];
    
    return ratings[4];
  }
  
  return '❓';
}