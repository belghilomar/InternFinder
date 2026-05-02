export interface Internship {
  id: string
  title: string
  company: string
  location: string
  type: 'Remote' | 'On-site' | 'Hybrid'
  domain: 'IT' | 'Finance' | 'Engineering' | 'Marketing' | 'Design' | 'HR'
  description: string
  requirements: string[]
  stipend?: string
  duration: string
  image: string
  matchScore?: number
}

export interface Testimonial {
  name: string
  role: string
  company: string
  content: string
  avatar: string
}

export interface Resource {
  id: string
  title: string
  description: string
  category: 'CV' | 'Cover Letter' | 'Interview'
  type: 'template' | 'guide'
}

export const tunisianCities = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Beja',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabes',
  'Medenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kebili',
]

export const mockInternships: Internship[] = []

export const featuredInternships: Internship[] = mockInternships.slice(0, 3)

export const testimonials: Testimonial[] = [
  {
    name: 'Sarah Johnson',
    role: 'Former Intern, Now Software Engineer',
    company: 'TechCorp',
    content:
      'My internship at TechCorp was transformative. The mentorship and real-world experience I gained was invaluable for my career.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    name: 'Michael Chen',
    role: 'Finance Professional',
    company: 'FinanceHub',
    content:
      'The financial analyst internship gave me practical skills that I use every day. Highly recommended!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Product Designer',
    company: 'DesignStudio',
    content:
      'Found my passion for design during this internship. The platform made it easy to discover the right opportunity.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
]

export const resources: Resource[] = [
  {
    id: '1',
    title: 'Professional CV Template',
    description:
      'A modern, ATS-friendly CV template that highlights your skills and achievements.',
    category: 'CV',
    type: 'template',
  },
  {
    id: '2',
    title: 'Cover Letter Guide',
    description: 'Learn how to write compelling cover letters that get you noticed by recruiters.',
    category: 'Cover Letter',
    type: 'guide',
  },
  {
    id: '3',
    title: 'Interview Preparation Tips',
    description:
      'Master common interview questions and techniques to make a great impression.',
    category: 'Interview',
    type: 'guide',
  },
  {
    id: '4',
    title: 'Technical Interview Template',
    description:
      'Prepare for coding interviews with our comprehensive template and practice problems.',
    category: 'Interview',
    type: 'template',
  },
  {
    id: '5',
    title: 'CV Format Best Practices',
    description:
      'Discover the formatting standards that make your CV stand out to recruiters.',
    category: 'CV',
    type: 'guide',
  },
  {
    id: '6',
    title: 'Behavioral Interview Guide',
    description:
      'Learn the STAR method and how to answer behavioral interview questions effectively.',
    category: 'Interview',
    type: 'guide',
  },
]

export const howItWorks = [
  {
    step: 1,
    title: 'Create Your Profile',
    description:
      'Tell us about your skills, interests, and career goals to build your professional profile.',
    icon: '01',
  },
  {
    step: 2,
    title: 'Get AI Matches',
    description:
      'Our AI analyzes thousands of internships and matches you with the best opportunities.',
    icon: '02',
  },
  {
    step: 3,
    title: 'Apply & Succeed',
    description:
      'Apply to matched internships with confidence and access our interview preparation resources.',
    icon: '03',
  },
]
