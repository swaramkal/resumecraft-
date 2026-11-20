export const DEFAULT_RESUME_DATA = {
  templateId: 'modern-horizon',
  accentColor: '#2563eb',
  compactMode: false,
  personal: {
    fullName: 'Aarav Sharma',
    title: 'Full-Stack Software Engineer',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    linkedin: 'linkedin.com/in/aaravsharma',
    github: 'github.com/aaravsharma',
    website: 'aaravsharma.dev',
    photo: ''
  },
  sections: [
    {
      id: 'summary',
      type: 'summary',
      title: 'Professional Summary',
      visible: true,
      content: 'Results-driven Full-Stack Software Engineer with 3+ years of experience building scalable web applications, RESTful APIs, and responsive user interfaces. Reduced checkout latency by 38% and improved automated test coverage to 92%.'
    },
    {
      id: 'experience',
      type: 'experience',
      title: 'Work Experience',
      visible: true,
      items: [
        {
          id: 'exp_1',
          role: 'Software Engineer',
          company: 'CloudNova Technologies',
          location: 'Bengaluru',
          startDate: 'Jul 2024',
          endDate: 'Present',
          bullets: 'Architected modular frontend components serving 180K+ monthly active users.\nOptimized SQL queries and caching layers, lowering average API response time from 410ms to 190ms.'
        },
        {
          id: 'exp_2',
          role: 'Junior Web Developer',
          company: 'PixelForge Digital',
          location: 'Hyderabad',
          startDate: 'Jun 2023',
          endDate: 'Jun 2024',
          bullets: 'Built responsive SaaS dashboards and integrated payment webhooks with 99.9% uptime.\nCollaborated with UX designers to improve mobile conversion rates by 24%.'
        }
      ]
    },
    {
      id: 'education',
      type: 'education',
      title: 'Education',
      visible: true,
      items: [
        {
          id: 'edu_1',
          degree: 'Bachelor of Computer Applications (BCA)',
          institution: 'Andhra University',
          location: 'Visakhapatnam',
          year: '2020 - 2023',
          score: 'CGPA: 8.9 / 10'
        }
      ]
    },
    {
      id: 'techSkills',
      type: 'tags',
      title: 'Technical Skills',
      visible: true,
      tags: ['JavaScript (ES6+)', 'HTML5 & CSS3', 'Python', 'Java', 'MySQL', 'Git & GitHub', 'REST APIs', 'Linux']
    },
    {
      id: 'softSkills',
      type: 'tags',
      title: 'Soft Skills',
      visible: true,
      tags: ['Problem Solving', 'Cross-Functional Collaboration', 'Agile Execution', 'Technical Communication']
    },
    {
      id: 'projects',
      type: 'projects',
      title: 'Projects',
      visible: true,
      items: [
        {
          id: 'proj_1',
          name: 'ResumeCraft Career Suite',
          tech: 'HTML5, CSS3, Vanilla JS, HTML2PDF',
          link: 'github.com/aaravsharma/resumecraft',
          description: 'Built an offline-first career builder featuring 24 resume templates, ATS keyword scoring, and instant A4 PDF export.'
        }
      ]
    },
    {
      id: 'certifications',
      type: 'certifications',
      title: 'Certifications',
      visible: true,
      items: [
        { id: 'cert_1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2025' }
      ]
    },
    {
      id: 'languages',
      type: 'tags',
      title: 'Languages',
      visible: true,
      tags: ['English (Fluent)', 'Hindi (Native)', 'Telugu (Conversational)']
    },
    {
      id: 'achievements',
      type: 'list',
      title: 'Achievements',
      visible: true,
      items: ['Winner, Smart India Hackathon Regional Round (2023)', 'Top 2% contributor in open-source UI accessibility audit']
    },
    {
      id: 'awards',
      type: 'list',
      title: 'Awards',
      visible: false,
      items: ['Employee of the Quarter - CloudNova Technologies (Q4 2025)']
    },
    {
      id: 'volunteer',
      type: 'experience',
      title: 'Volunteer Experience',
      visible: false,
      items: [
        {
          id: 'vol_1',
          role: 'Coding Mentor',
          company: 'CodeForYouth Initiative',
          location: 'Remote',
          startDate: '2023',
          endDate: '2024',
          bullets: 'Mentored 60+ undergraduate students in web development fundamentals and Git workflows.'
        }
      ]
    },
    {
      id: 'publications',
      type: 'list',
      title: 'Publications',
      visible: false,
      items: ['Optimizing Client-Side PDF Rendering Pipelines in Modern Browsers (2025)']
    },
    {
      id: 'interests',
      type: 'tags',
      title: 'Interests',
      visible: false,
      tags: ['Open-Source Software', 'UI Systems', 'Cricket Analytics', 'Technical Writing']
    }
  ]
};
