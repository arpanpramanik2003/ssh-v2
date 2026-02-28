// University Programs Data Structure
// Hierarchical organization: Category → Program → Specializations

export const PROGRAM_CATEGORIES = {
  ENGINEERING: 'Engineering & Technology',
  COMPUTER_APP: 'Computer Applications',
  SCIENCE: 'Science',
  AGRICULTURE: 'Agriculture & Fisheries',
  HEALTH: 'Health Sciences & Pharmacy',
  NURSING: 'Nursing',
  MARITIME: 'Maritime Studies',
  MANAGEMENT: 'Management, Commerce & Law',
  HOSPITALITY: 'Hospitality & Culinary Arts',
  PHD: 'Ph.D. Programs'
};

export const UNIVERSITY_PROGRAMS = {
  [PROGRAM_CATEGORIES.ENGINEERING]: [
    {
      degree: 'B.Tech',
      name: 'Bachelor of Technology',
      duration: '4 years',
      hasLateralEntry: true,
      specializations: [
        'Robotics & Automation',
        'Computer Science & Engineering',
        'CSE - Cyber Security',
        'CSE - Data Science',
        'CSE - Artificial Intelligence & Machine Learning',
        'Marine Engineering'
      ]
    },
    {
      degree: 'M.Tech',
      name: 'Master of Technology',
      duration: '2 years',
      hasLateralEntry: false,
      specializations: [
        'Computer Science & Engineering (Data Science)',
        'Artificial Intelligence & Machine Learning'
      ]
    }
  ],
  [PROGRAM_CATEGORIES.COMPUTER_APP]: [
    { degree: 'BCA', name: 'Bachelor of Computer Applications', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'MCA', name: 'Master of Computer Applications', duration: '2 years', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.SCIENCE]: [
    { degree: 'B.Sc (Hons.)', name: 'Bachelor of Science (Honours)', duration: '3 years', hasLateralEntry: false, specializations: ['Biotechnology', 'Microbiology', 'Applied Psychology'] },
    { degree: 'M.Sc', name: 'Master of Science', duration: '2 years', hasLateralEntry: false, specializations: ['Biotechnology', 'Microbiology', 'Applied Psychology', 'Physics', 'Chemistry', 'Mathematics'] }
  ],
  [PROGRAM_CATEGORIES.AGRICULTURE]: [
    { degree: 'B.Sc (Hons.) Agriculture', name: 'Bachelor of Science (Honours) in Agriculture', duration: '4 years', hasLateralEntry: false, specializations: [] },
    { degree: 'B.F.Sc', name: 'Bachelor of Fisheries Science', duration: '4 years', hasLateralEntry: false, specializations: [] },
    { degree: 'M.Sc Agriculture', name: 'Master of Science in Agriculture', duration: '2 years', hasLateralEntry: false, specializations: ['Agronomy', 'Soil Science', 'Horticulture', 'Plant Pathology', 'Agricultural Economics'] }
  ],
  [PROGRAM_CATEGORIES.HEALTH]: [
    { degree: 'B.Pharm', name: 'Bachelor of Pharmacy', duration: '4 years', hasLateralEntry: false, specializations: [] },
    { degree: 'D.Pharm', name: 'Diploma in Pharmacy', duration: '2 years', hasLateralEntry: false, specializations: [] },
    { degree: 'M.Pharm', name: 'Master of Pharmacy', duration: '2 years', hasLateralEntry: false, specializations: ['Pharmaceutics', 'Pharmacology', 'Pharmaceutical Chemistry', 'Pharmacognosy'] },
    { degree: 'BPT', name: 'Bachelor of Physiotherapy', duration: '4.5 years', hasLateralEntry: false, specializations: [] },
    { degree: 'B.Optom', name: 'Bachelor of Optometry', duration: '4 years', hasLateralEntry: false, specializations: [] },
    { degree: 'M.Optom', name: 'Master of Optometry', duration: '2 years', hasLateralEntry: false, specializations: [] },
    { degree: 'BMLT', name: 'Bachelor of Medical Laboratory Technology', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'BMRIT', name: 'Bachelor of Medical Radiology & Imaging Technology', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'B.Sc OTT', name: 'B.Sc in Operation Theatre Technology', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'B.Sc CCT', name: 'B.Sc in Critical Care Technology', duration: '3 years', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.NURSING]: [
    { degree: 'B.Sc Nursing', name: 'Bachelor of Science in Nursing', duration: '4 years', hasLateralEntry: false, specializations: [] },
    { degree: 'GNM', name: 'General Nursing & Midwifery', duration: '3 years', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.MARITIME]: [
    { degree: 'B.Sc Nautical Science', name: 'Bachelor of Science in Nautical Science', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'DNS', name: 'Diploma in Nautical Science', duration: '1 year', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.MANAGEMENT]: [
    { degree: 'BBA (Hons.)', name: 'Bachelor of Business Administration (Honours)', duration: '3 years', hasLateralEntry: false, specializations: ['Digital Marketing', 'Logistics & Supply Chain', 'Finance', 'International Business', 'Human Resource Management'] },
    { degree: 'MBA', name: 'Master of Business Administration', duration: '2 years', hasLateralEntry: false, specializations: ['Marketing', 'Finance', 'Human Resources', 'Agri-Business', 'Operations Management', 'Information Technology'] },
    { degree: 'B.Com (Hons.)', name: 'Bachelor of Commerce (Honours)', duration: '3 years', hasLateralEntry: false, specializations: ['Taxation', 'E-Commerce', 'Banking & Finance', 'Accounting'] },
    { degree: 'B.A. LL.B (Hons.)', name: 'Bachelor of Arts & Bachelor of Laws (Integrated)', duration: '5 years', hasLateralEntry: false, specializations: [] },
    { degree: 'B.B.A. LL.B (Hons.)', name: 'Bachelor of Business Administration & Bachelor of Laws (Integrated)', duration: '5 years', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.HOSPITALITY]: [
    { degree: 'B.Sc HHA', name: 'B.Sc in Hospitality & Hotel Administration', duration: '3 years', hasLateralEntry: false, specializations: ['With Swiss Diploma', 'Regular'] },
    { degree: 'B.Sc Culinary Arts', name: 'B.Sc in Culinary Arts', duration: '3 years', hasLateralEntry: false, specializations: [] },
    { degree: 'MHM', name: 'Master in Hospital Management', duration: '2 years', hasLateralEntry: false, specializations: [] }
  ],
  [PROGRAM_CATEGORIES.PHD]: [
    { degree: 'Ph.D.', name: 'Doctor of Philosophy', duration: 'Variable', hasLateralEntry: false, specializations: ['Engineering', 'Science', 'Humanities', 'Pharmacy', 'Agriculture', 'Management', 'Computer Applications'] }
  ]
};

export const getCategoryValue = (categoryKeyOrValue) => {
  if (Object.values(PROGRAM_CATEGORIES).includes(categoryKeyOrValue)) return categoryKeyOrValue;
  if (PROGRAM_CATEGORIES[categoryKeyOrValue]) return PROGRAM_CATEGORIES[categoryKeyOrValue];
  return null;
};

export const getCategoryKey = (categoryValueOrKey) => {
  if (PROGRAM_CATEGORIES[categoryValueOrKey]) return categoryValueOrKey;
  const entry = Object.entries(PROGRAM_CATEGORIES).find(([, value]) => value === categoryValueOrKey);
  return entry ? entry[0] : null;
};

export const getProgramsByCategory = (category) => {
  const categoryValue = getCategoryValue(category);
  return categoryValue ? (UNIVERSITY_PROGRAMS[categoryValue] || []) : [];
};

export const getSpecializations = (category, degree) => {
  const programs = getProgramsByCategory(category);
  const program = programs.find(p => p.degree === degree);
  return program ? program.specializations : [];
};

export const formatProgramDisplay = (category, degree, specialization) => {
  if (specialization) return `${degree} - ${specialization}`;
  return degree;
};

export default UNIVERSITY_PROGRAMS;
