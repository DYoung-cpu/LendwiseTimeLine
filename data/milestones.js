/**
 * LendWise Milestone Data
 * Extracted from timeline-dev.html for better separation of concerns
 */

import { Milestone } from './milestone-schema.js';

// Raw milestone data extracted from HTML
const rawMilestoneData = {
    inception: {
        title: "Company Inception",
        date: "March 2025",
        category: "Foundation",
        icon: "🚀",
        description: "The inception of LendWise Mortgage Corporation marks the beginning of our journey to transform mortgage lending through innovation, technology, and unwavering commitment to client success.",
        impact: "Founding vision established with leadership team and initial strategic framework",
        metrics: [
            "Executive leadership team assembled",
            "Initial capital commitments secured",
            "Core strategic partnerships identified",
            "Technology and innovation roadmap defined"
        ],
        team: "Founding partners bring combined 50+ years of mortgage and technology expertise",
        challenges: "Creating differentiation in a traditional industry ready for disruption",
        outcome: "Launch of a transformative mortgage lending platform with clear vision and strong foundation"
    },
    founded: {
        title: "Company Founded",
        date: "August 1, 2024",
        category: "Foundation",
        icon: "🏢",
        description: "LendWise Mortgage Corporation was officially established as a Delaware C-Corporation with a vision to revolutionize the mortgage lending industry through technology and exceptional service.",
        impact: "Established the foundation for what would become a leading mortgage technology platform",
        metrics: [
            "Initial team of 3 founders",
            "Secured seed funding of $500K",
            "Delaware C-Corporation structure",
            "Business plan and roadmap created"
        ],
        team: "David Young (Founder & CEO) with 24 years mortgage banking expertise",
        challenges: "Building credibility in a highly regulated and competitive market",
        outcome: "Successfully launched with proper structure and clear vision for disrupting the mortgage industry"
    },
    headquarters: {
        title: "Premium Office Location",
        date: "June 2025",
        category: "Infrastructure",
        icon: "🏢",
        description: "Established our state-of-the-art headquarters in Woodland Hills, California.",
        impact: "Created a professional home base for operations and growth",
        metrics: [
            "21800 Oxnard Street, Woodland Hills",
            "15,000 sq ft modern facility",
            "150+ employee capacity",
            "LEED Gold certified building"
        ],
        team: "Full operational staff supporting all divisions",
        challenges: "Finding the perfect location with room for growth",
        outcome: "World-class facility supporting our nationwide operations"
    },
    location: {
        title: "Premium Office Location",
        date: "August 1, 2024",
        category: "Infrastructure",
        icon: "🏢",
        address: "1234 Business Park Drive, Suite 500, Newport Beach, CA 92660",
        images: [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", // Modern office exterior
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200", // Open workspace
            "https://images.unsplash.com/photo-1497366754035-f200586c5e9b?w=1200", // Conference room
            "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=1200"  // Lounge area
        ],
        description: "Secured a state-of-the-art 8,500 sq ft office space in the heart of Newport Beach's prestigious financial district, providing the perfect environment for innovation and growth.",
        details: {
            size: "8,500 square feet",
            floors: "5th floor penthouse suite",
            capacity: "75+ employees",
            parking: "150 dedicated spaces",
            lease: "5-year term with expansion options"
        },
        whyThisLocation: [
            "Prime location in Newport Beach financial district",
            "Walking distance to major banks and lending partners",
            "Easy freeway access (405/55/73 interchange)",
            "Prestigious Class A business address",
            "Modern building with latest technology infrastructure",
            "Ocean views inspiring creativity and excellence"
        ],
        amenities: [
            "24/7 secured access with biometric entry",
            "Dedicated 10GB fiber internet connection",
            "Modern HVAC with HEPA air purification",
            "Electric vehicle charging stations (10 spots)",
            "On-site fitness center and wellness room",
            "Rooftop terrace for events and meetings"
        ],
        spaces: [
            "Executive offices (8 private)",
            "Open collaboration areas (3 zones)",
            "Conference rooms (4 with video conferencing)",
            "Training room (40 person capacity)",
            "Employee lounge with full kitchen",
            "Client meeting suites with privacy"
        ],
        impact: "Created a professional headquarters that reflects our commitment to excellence and innovation",
        metrics: [
            "25% under market rate secured",
            "90% employee satisfaction with location",
            "15-minute average commute time",
            "LEED Gold certified building"
        ],
        outcome: "Established a flagship location that supports our growth and reinforces our professional brand"
    },
    nmls: {
        title: "NMLS Registration",
        date: "September 1, 2024",
        category: "Licensing",
        icon: "📜",
        description: "Achieved Nationwide Mortgage Licensing System (NMLS) registration, establishing our foundation for multi-state mortgage operations.",
        impact: "Enabled legal operation as a mortgage company across multiple states",
        metrics: [
            "NMLS ID: #2581507",
            "30-day approval process",
            "$50,000 surety bond posted",
            "All key personnel vetted and approved"
        ],
        team: "Compliance team and legal counsel",
        challenges: "Complex application process and extensive background checks",
        outcome: "Approved status allowing nationwide mortgage operations"
    },
    dre: {
        title: "California DRE License",
        date: "October 15, 2024",
        category: "Licensing",
        icon: "🏛️",
        description: "Secured California Department of Real Estate broker license, enabling full mortgage operations in California.",
        impact: "Authorized to conduct mortgage business in California, the largest mortgage market in the US",
        metrics: [
            "Broker license secured",
            "Responsible broker designated",
            "Trust account established",
            "Office location approved"
        ],
        team: "Legal and compliance teams",
        outcome: "Full authorization to originate mortgages in California"
    },
    'dfpi-ai': {
        title: "DFPI AI Platform",
        date: "October 2025",
        category: "Technology",
        icon: "🤖",
        description: "Successfully deployed AI-powered compliance and risk assessment platform for DFPI regulatory requirements.",
        impact: "Automated regulatory compliance monitoring with AI-driven risk assessment",
        metrics: [
            "Real-time compliance monitoring",
            "Automated risk scoring",
            "95% accuracy in regulatory predictions",
            "50% reduction in compliance processing time"
        ],
        team: "AI development and compliance teams",
        challenges: "Integrating complex regulatory requirements with AI decision-making",
        outcome: "Industry-leading AI compliance platform"
    },
    los: {
        title: "LOS Platform Integration",
        date: "October 2025",
        category: "Technology",
        icon: "💻",
        description: "Advanced Loan Origination System integration with AI-powered workflow automation and enhanced processing capabilities.",
        status: "In Progress",
        impact: "Next-generation loan processing with AI automation and streamlined workflows",
        metrics: [
            "AI-powered application processing",
            "Advanced workflow automation",
            "Real-time status tracking",
            "Integrated compliance monitoring",
            "Mobile-optimized interface"
        ],
        team: "Technology team and AI development specialists",
        challenges: "Integrating AI capabilities with traditional LOS workflows",
        outcome: "Target: Industry-leading automated loan origination platform"
    },
    dscr: {
        title: "DSCR Generator Launch",
        date: "January 10, 2025",
        category: "Product",
        icon: "🚀",
        description: "Launched proprietary DSCR (Debt Service Coverage Ratio) qualification tool for investment property loans.",
        impact: "Revolutionary tool providing instant DSCR calculations and pre-approvals",
        metrics: [
            "< 5 second calculation time",
            "500+ properties analyzed",
            "99.9% accuracy rate",
            "PDF report generation"
        ],
        team: "Product development team",
        outcome: "Industry-first instant DSCR qualification tool"
    },
    multistate: {
        title: "Multi-State Licensing",
        date: "February 1, 2025",
        category: "Expansion",
        icon: "🗺️",
        description: "Achieved licensing in 7 states, marking our first major geographic expansion.",
        impact: "Expanded market reach to cover 100M+ population",
        metrics: [
            "Licensed in CA, AZ, NV, OR, WA, TX, FL",
            "100M+ population coverage",
            "$2.5T market opportunity",
            "7 state compliance frameworks"
        ],
        outcome: "Regional mortgage lender with multi-state presence"
    },
    crm: {
        title: "Mission Control CRM",
        date: "March 1, 2025",
        category: "Product",
        icon: "📊",
        description: "Launching AI-powered CRM system specifically designed for loan officers.",
        status: "In Progress",
        impact: "Complete loan officer workflow automation and intelligence",
        metrics: [
            "AI-powered lead scoring",
            "Automated follow-ups",
            "Pipeline management",
            "Integrated communication tools"
        ],
        team: "Product and AI development teams",
        outcome: "Target: Most advanced LO-focused CRM in the industry"
    },
    fhava: {
        title: "FHA/VA Approval",
        date: "June 2025",
        category: "Licensing",
        icon: "🏛️",
        description: "Pursuing FHA and VA approval to serve first-time homebuyers and veterans.",
        status: "Planned",
        impact: "Access to government-backed loan programs",
        metrics: [
            "FHA lender approval",
            "VA lender authorization",
            "Ginnie Mae issuer status",
            "Expanded product offerings"
        ],
        outcome: "Target: Full government lending capabilities"
    },
    underwriting: {
        title: "AI Underwriting",
        date: "September 2025",
        category: "Innovation",
        icon: "🧠",
        description: "Automated underwriting system using artificial intelligence for faster, more accurate loan decisions.",
        status: "Planned",
        impact: "Revolutionary AI-powered underwriting reducing decision time to hours",
        metrics: [
            "24-hour decisions",
            "95% automation rate",
            "Enhanced risk assessment",
            "Reduced human error"
        ],
        outcome: "Target: Fastest underwriting in the industry"
    },
    licensing: {
        title: "Multi-State Licensing",
        date: "May 2025",
        category: "Regulatory Compliance",
        icon: "📜",
        description: "LendWise achieves multi-state licensing, establishing our presence in California and Florida.",
        impact: "Enabled legal mortgage operations in two major states",
        metrics: [
            "California DRE License #02184567",
            "Florida License #MLD1826",
            "Combined population coverage: 60M+",
            "$2.5T combined housing market"
        ],
        team: "Dedicated compliance team ensures regulatory adherence",
        challenges: "Meeting diverse state requirements and maintaining compliance",
        outcome: "Foundation for nationwide expansion established"
    },
    staff: {
        title: "The Team",
        date: "July 2025",
        category: "Human Resources",
        icon: "👥",
        description: "Building a world-class team of mortgage professionals dedicated to excellence and innovation.",
        impact: "Assembled industry-leading talent to drive our mission forward",
        metrics: [
            "25+ dedicated professionals",
            "200+ years combined experience",
            "98% client satisfaction rating",
            "24/7 support availability"
        ],
        team: "Cross-functional experts in lending, technology, compliance, and customer service",
        challenges: "Recruiting top talent in a competitive market",
        outcome: "Created a culture of excellence with passionate professionals"
    },
    team: {
        title: "The Team",
        date: "July 2025",
        category: "Human Resources",
        icon: "👥",
        description: "Building a world-class team of mortgage professionals dedicated to excellence and innovation.",
        impact: "Assembled industry-leading talent to drive our mission forward",
        metrics: [
            "25+ dedicated professionals",
            "200+ years combined experience",
            "98% client satisfaction rating",
            "24/7 support availability"
        ],
        team: "Cross-functional experts in lending, technology, compliance, and customer service",
        challenges: "Recruiting top talent in a competitive market",
        outcome: "Created a culture of excellence with passionate professionals"
    },
    wisr: {
        title: "WISR AI Platform",
        date: "June 10, 2025",
        category: "Artificial Intelligence",
        icon: "🤖",
        description: "Revolutionary AI platform serving as the intelligent backbone of LendWise, providing personalized assistance to loan officers, borrowers, and support staff across all operations.",
        impact: "Transformed lending operations with AI-powered automation and intelligent decision-making",
        metrics: [
            "24/7 AI assistance for all users",
            "Instant pre-approval capabilities",
            "Real-time investor guideline matching",
            "99.9% uptime reliability",
            "Sub-second response times"
        ],
        capabilities: [
            "Instant loan pre-approvals with AI underwriting",
            "Real-time investor guidelines and compliance checking",
            "Natural language Q&A for any lending question",
            "Automated document analysis and verification",
            "Predictive analytics for loan performance",
            "Smart pricing optimization",
            "Intelligent lead scoring and routing",
            "Automated workflow orchestration"
        ],
        integrations: [
            "Connected to all LendWise systems",
            "Integrated with major credit bureaus",
            "Links to investor platforms",
            "Syncs with compliance databases",
            "Connects to market data feeds"
        ],
        team: "AI engineers, data scientists, and mortgage experts collaborating to build intelligent solutions",
        challenges: "Creating an AI that truly understands the complexities of mortgage lending",
        outcome: "Industry's most advanced AI assistant revolutionizing how lending professionals work"
    },
    'google-sponsor': {
        title: "Google Analytics Official Sponsorship",
        date: "April 2025",
        category: "Strategic Partnership",
        icon: "🤝",
        description: "LendWise becomes an official Google Analytics partner, gaining exclusive access to beta features, dedicated support, and co-marketing opportunities.",
        impact: "Elevated market position as a technology-forward mortgage lender",
        metrics: [
            "Official Google Analytics Partner status",
            "Access to beta features and early releases",
            "Dedicated Google support team",
            "Co-marketing opportunities worth $250K+",
            "Annual conference speaking opportunities"
        ],
        benefits: [
            "Priority access to new GA4 features",
            "Quarterly business reviews with Google team",
            "Custom training for our analytics team",
            "Joint case studies and white papers",
            "Google Cloud credits worth $100K annually"
        ],
        sponsorshipDetails: {
            tier: "Premier Partner",
            duration: "3-year agreement",
            value: "$500K in total benefits",
            certification: "Google Analytics Certified Company"
        },
        team: "Dedicated team of 5 certified Google Analytics professionals",
        challenges: "Meeting Google's stringent partner requirements and maintaining certification standards",
        outcome: "Industry recognition as a data-driven, technology-first mortgage lender"
    },
    pos: {
        title: "POS System Integration",
        date: "October 2025",
        category: "Technology",
        icon: "💳",
        description: "Advanced Point of Sale system integration for streamlined transaction processing and customer experience.",
        status: "In Progress",
        impact: "Enhanced customer experience with integrated payment processing and loan origination",
        metrics: [
            "Real-time payment processing",
            "Integrated loan application workflow",
            "Multi-channel support (web, mobile, in-person)",
            "99.9% transaction success rate"
        ],
        team: "Technology and product development teams",
        challenges: "Seamless integration with existing LOS and compliance systems",
        outcome: "Target: Industry-leading customer experience platform"
    },
    'mission-control': {
        title: "Mission Control CRM",
        date: "November 2025",
        category: "Product",
        icon: "🎛️",
        description: "Next-generation CRM platform designed specifically for loan officers with AI-powered automation and intelligence.",
        status: "Planned",
        impact: "Revolutionary loan officer productivity with AI-powered workflow automation",
        metrics: [
            "AI-powered lead scoring and routing",
            "Automated follow-up sequences",
            "Integrated communication tools",
            "Real-time pipeline analytics",
            "Mobile-first design"
        ],
        team: "Product development and AI teams",
        challenges: "Creating the most intuitive and powerful LO-focused CRM in the industry",
        outcome: "Target: #1 loan officer productivity platform"
    },
    nationwide: {
        title: "25-State Goal",
        date: "December 2025",
        category: "Milestone",
        icon: "🎯",
        description: "Achieving presence in 25 states, establishing LendWise as a true national mortgage lender.",
        status: "Planned",
        impact: "National mortgage lender status with coast-to-coast coverage",
        metrics: [
            "25 state licenses",
            "200M+ population coverage",
            "50+ loan officers",
            "$5B annual origination target"
        ],
        outcome: "Target: Top 100 mortgage lender nationally"
    }
};

// Convert raw data to Milestone instances with validation
const milestones = Object.entries(rawMilestoneData).map(([id, data]) => {
    try {
        return new Milestone({ id, ...data });
    } catch (error) {
        console.error(`Error creating milestone "${id}":`, error.message);
        throw error;
    }
});

// Export as object (backward compatible with existing code)
export const milestoneData = Object.fromEntries(
    milestones.map(m => [m.id, m])
);

// Export as array for iteration
export const milestonesArray = milestones;

// Utility functions

/**
 * Get a single milestone by ID
 */
export function getMilestone(id) {
    return milestoneData[id] || null;
}

/**
 * Get all milestones as an array
 */
export function getAllMilestones() {
    return milestonesArray;
}

/**
 * Get milestones filtered by category
 */
export function getMilestonesByCategory(category) {
    return milestonesArray.filter(m => m.category === category);
}

/**
 * Get milestones filtered by status
 */
export function getMilestonesByStatus(status) {
    return milestonesArray.filter(m => m.status === status);
}

/**
 * Get all unique categories
 */
export function getCategories() {
    return [...new Set(milestonesArray.map(m => m.category))];
}

/**
 * Get milestone count
 */
export function getMilestoneCount() {
    return milestonesArray.length;
}
