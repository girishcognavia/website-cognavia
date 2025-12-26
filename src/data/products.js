import { MessageSquare, FileText, Search, Stethoscope } from 'lucide-react';
import cognaAssistImg from '../assets/cogna-assist.png';
import cognaBriefImg from '../assets/cogna-brief.png';
import cognaFileSearchImg from '../assets/cogna-filesearch.png';
import medibookAiImg from '../assets/medibook-ai.png';

export const products = [
    {
        id: 'cogna-assist',
        name: 'CognaAssist',
        tagline: 'AI-Powered Customer Support Chatbot',
        description: 'Transform your website into a 24/7 customer support powerhouse. Add two lines of code, and your visitors get instant, accurate answers based on your actual website content.',
        icon: MessageSquare,
        image: cognaAssistImg,
        color: 'indigo',
        features: [
            'Instant Website Integration (60 seconds)',
            'Automatic Content Learning & Crawling',
            'Intelligent AI Responses via RAG',
            '24/7 Availability',
            'Multi-Tenant Architecture',
            'Real-Time Analytics'
        ],
        pricing: 'Starter plan available',
        path: '/products/cogna-assist',
        details: {
            heroTitle: 'AI-Powered Customer Support Chatbot for Your Website',
            heroSubtitle: 'CognaAssist is an intelligent, self-learning chatbot platform that transforms your website into a 24/7 customer support powerhouse.',
            howItWorks: [
                { title: 'Register', description: 'Sign up with your company details and website URL.' },
                { title: 'Crawl', description: 'CognaAssist automatically crawls and indexes your website content.' },
                { title: 'Train', description: 'AI processes your content to create a knowledge base.' },
                { title: 'Integrate', description: 'Add two lines of code to your website.' },
                { title: 'Serve', description: 'Start serving customers instantly 24/7.' }
            ],
            benefits: [
                { title: 'Reduce Support Costs', description: 'Handle thousands of inquiries without hiring more staff.' },
                { title: 'Increase Satisfaction', description: 'Instant responses mean happier customers.' },
                { title: 'Capture Leads', description: 'Engage visitors the moment they have questions.' }
            ],
            useCases: [
                'E-Commerce Businesses',
                'Service Providers',
                'SaaS Companies',
                'Educational Institutions',
                'Healthcare Providers',
                'Real Estate Agencies'
            ]
        }
    },
    {
        id: 'cogna-brief',
        name: 'CognaBrief',
        tagline: 'AI-Powered Document Summarization Platform',
        description: 'Transform lengthy documents into concise, actionable insights in seconds. Leverages advanced AI to deliver professional-grade summaries with unmatched accuracy.',
        icon: FileText,
        image: cognaBriefImg,
        color: 'purple',
        features: [
            'Multi-Format Support (PDF, DOCX, TXT)',
            'Three Summary Levels (Quick, Standard, Detailed)',
            'Dual-AI Quality Assurance',
            'Page-Level Citations',
            'Visual Element Detection',
            'Professional Output Format'
        ],
        pricing: 'Flexible plans',
        path: '/products/cogna-brief',
        details: {
            heroTitle: 'AI-Powered Document Summarization Platform',
            heroSubtitle: 'Transform lengthy documents into concise, actionable insights in seconds with professional-grade accuracy.',
            howItWorks: [
                { title: 'Upload', description: 'Drag and drop PDF, DOCX, or TXT files.' },
                { title: 'Select', description: 'Choose from Quick, Standard, or Detailed summary types.' },
                { title: 'Process', description: 'AI analyzes, extracts, and generates the summary.' },
                { title: 'Review', description: 'Access your professional summary with citations.' }
            ],
            benefits: [
                { title: 'Save Time', description: 'Summarize 50-page documents in under a minute.' },
                { title: 'Improve Accuracy', description: 'Dual-AI verification ensures no critical info is missed.' },
                { title: 'Maintain Consistency', description: ' consistent, professionally formatted summaries every time.' }
            ],
            useCases: [
                'Research & Academia',
                'Legal & Compliance',
                'Business & Finance',
                'Healthcare & Life Sciences',
                'Technical & Engineering'
            ]
        }
    },
    {
        id: 'cogna-filesearch',
        name: 'CognaFileSearch',
        tagline: 'Intelligent Document Similarity Matching',
        description: 'Automates the comparison of technical specifications, drawings, and documents against your existing repository. Find matches in seconds, not hours.',
        icon: Search,
        image: cognaFileSearchImg,
        color: 'cyan',
        features: [
            'Instant Results (10,000+ docs in < 3s)',
            'Intelligent PDF Processing & OCR',
            'Advanced Similarity Matching',
            'Flexible Repository Management',
            'Weighted Scoring Algorithm',
            'Enterprise-Ready Security'
        ],
        pricing: 'Contact for pricing',
        path: '/products/cogna-filesearch',
        details: {
            heroTitle: 'Intelligent Document Similarity Matching System',
            heroSubtitle: 'Transform hours of manual searching into seconds of AI-powered matching for engineering and manufacturing.',
            howItWorks: [
                { title: 'Configure', description: 'Point to your existing document repository.' },
                { title: 'Batch Process', description: 'System indexes your existing documents.' },
                { title: 'Upload & Search', description: 'Upload a new document to find matches.' },
                { title: 'Review', description: 'See ranked similarity matches with scores.' }
            ],
            benefits: [
                { title: 'Instant Results', description: 'Search 10,000+ documents in under 3 seconds.' },
                { title: 'Prevent Duplication', description: 'Instantly surface existing similar designs.' },
                { title: 'Consistent Matching', description: 'Algorithmic approach ensures reliable results.' }
            ],
            useCases: [
                'Manufacturing Industry',
                'Engineering Firms',
                'Quality Assurance',
                'Procurement'
            ]
        }
    },
    {
        id: 'medibook-ai',
        name: 'MediBook AI',
        tagline: 'Intelligent Hospital Appointment Booking',
        description: 'Transforms the patient appointment booking experience through an AI-powered, multilingual chatbot that understands symptoms and matches patients with specialists.',
        icon: Stethoscope,
        image: medibookAiImg,
        color: 'emerald',
        features: [
            'AI-Powered Symptom Understanding',
            'True Bilingual Support (Hindi/English)',
            'Intelligent Doctor Matching (90%+ Accuracy)',
            '24/7 Availability',
            'DPDPA 2023 Compliant',
            'WhatsApp Integration'
        ],
        pricing: 'Starter, Professional, Enterprise',
        path: '/products/medibook-ai',
        details: {
            heroTitle: 'Intelligent Hospital Appointment Booking System',
            heroSubtitle: 'AI-powered, multilingual chatbot that understands symptoms and intelligently matches patients with the right specialists.',
            howItWorks: [
                { title: 'Chat', description: 'Patient describes symptoms in plain language.' },
                { title: 'Analyze', description: 'AI analyzes symptoms and recommends specialty.' },
                { title: 'Select', description: 'Patient chooses doctor and time slot.' },
                { title: 'Confirm', description: 'Instant confirmation via SMS and Email.' }
            ],
            benefits: [
                { title: 'For Patients', description: '24/7 booking, no medical knowledge needed.' },
                { title: 'For Hospitals', description: 'Reduce call volume by 50-60%.' },
                { title: 'For Doctors', description: 'See the right patients with pre-screening.' }
            ],
            useCases: [
                'Multi-specialty Hospitals',
                'Clinics & Medical Centers',
                'Healthcare Networks'
            ]
        }
    }
];
